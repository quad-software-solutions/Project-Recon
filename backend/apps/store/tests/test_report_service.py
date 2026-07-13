from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import Branch, User
from apps.store.constants import PaymentStatus
from apps.store.models import Product, ProductCategory
from apps.store.models.branch_inventory import BranchInventory
from apps.store.models.order import Order, OrderStatus
from apps.store.models.payment import StorePayment
from apps.store.models.pending_order import PendingOrder, PendingOrderItem
from apps.store.services.branch_inventory_service import add_inventory
from apps.store.services.category_service import create_category
from apps.store.services.order_service import (
    change_order_status,
    create_order_from_pending_order,
)
from apps.store.services.product_service import archive_product, create_product
from apps.store.services.report_service import (
    branch_sales_report,
    inventory_report,
    low_stock_report,
    order_report,
    product_statistics,
    sales_report,
)


def _create_paid_order(user, branch, category, items_data):
    pending = PendingOrder.objects.create(
        user=user,
        branch=branch,
        subtotal=sum(d["subtotal"] for d in items_data),
        total=sum(d["subtotal"] for d in items_data),
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    payment = StorePayment.objects.create(
        pending_order=pending,
        amount=pending.total,
        transaction_reference=f"STORE-rpt-{user.pk}-{pending.pk}",
        status=PaymentStatus.PAID,
    )
    pending.payment_reference = payment.transaction_reference
    pending.save(update_fields=["payment_reference"])

    for data in items_data:
        PendingOrderItem.objects.create(
            pending_order=pending,
            product=data["product"],
            quantity=data["quantity"],
            unit_price=float(data["product"].price),
            subtotal=data["subtotal"],
        )
        add_inventory(branch, data["product"], data["quantity"])

    return create_order_from_pending_order(pending)


class ProductStatisticsTest(TestCase):
    def setUp(self):
        self.cat_active = create_category({"name": "Active Category"})
        self.cat_empty = create_category({"name": "Empty Category"})

        self.prod1 = create_product({
            "category": self.cat_active.pk,
            "name": "Product A",
            "slug": "prod-a",
            "sku": "A-001",
            "price": 50.00,
        })
        self.prod2 = create_product({
            "category": self.cat_active.pk,
            "name": "Product B",
            "slug": "prod-b",
            "sku": "B-001",
            "price": 100.00,
        })
        self.archived = create_product({
            "category": self.cat_active.pk,
            "name": "Old Product",
            "slug": "old-prod",
            "sku": "OLD-001",
            "price": 25.00,
        })
        archive_product(self.archived)

    def test_product_statistics_structure(self):
        result = product_statistics()
        self.assertIn("summary", result)
        self.assertIn("price_stats", result)
        self.assertIn("by_category", result)

    def test_product_statistics_summary(self):
        result = product_statistics()
        s = result["summary"]
        self.assertEqual(s["total_products"], 3)
        self.assertEqual(s["active_products"], 2)
        self.assertEqual(s["archived_products"], 1)

    def test_product_statistics_price_stats(self):
        result = product_statistics()
        p = result["price_stats"]
        self.assertEqual(p["min"], 25.0)
        self.assertEqual(p["max"], 100.0)
        self.assertAlmostEqual(p["avg"], 58.33, places=2)

    def test_product_statistics_by_category(self):
        result = product_statistics()
        cats = {c["name"]: c for c in result["by_category"]}
        self.assertIn("Active Category", cats)
        self.assertIn("Empty Category", cats)
        self.assertEqual(cats["Active Category"]["total_products"], 3)
        self.assertEqual(cats["Active Category"]["active_products"], 2)
        self.assertEqual(cats["Empty Category"]["total_products"], 0)


class InventoryReportTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main", code="M01")
        self.branch2 = Branch.objects.create(name="Second", code="M02")
        self.cat = create_category({"name": "Cat"})
        self.prod_a = create_product({
            "category": self.cat.pk, "name": "Alpha", "slug": "alpha", "sku": "A", "price": 10,
        })
        self.prod_b = create_product({
            "category": self.cat.pk, "name": "Beta", "slug": "beta", "sku": "B", "price": 20,
        })
        add_inventory(self.branch, self.prod_a, 10)
        add_inventory(self.branch, self.prod_b, 5)
        add_inventory(self.branch2, self.prod_a, 3)

    def test_inventory_report_all(self):
        data = inventory_report()
        self.assertEqual(len(data), 3)

    def test_inventory_report_by_branch(self):
        data = inventory_report(branch_id=self.branch.pk)
        self.assertEqual(len(data), 2)
        for row in data:
            self.assertEqual(row["branch_id"], str(self.branch.pk))

    def test_inventory_report_fields(self):
        data = inventory_report()
        row = data[0]
        self.assertIn("branch_id", row)
        self.assertIn("product_name", row)
        self.assertIn("sku", row)
        self.assertIn("quantity", row)
        self.assertIn("minimum_quantity", row)


class LowStockReportTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="B", code="B01")
        self.cat = create_category({"name": "Cat"})
        self.prod = create_product({
            "category": self.cat.pk, "name": "Item", "slug": "item", "sku": "I", "price": 10,
        })
        self.prod2 = create_product({
            "category": self.cat.pk, "name": "Item2", "slug": "item2", "sku": "I2", "price": 15,
        })
        add_inventory(self.branch, self.prod, 10)
        inv = BranchInventory.objects.get(branch=self.branch, product=self.prod)
        inv.minimum_quantity = 20
        inv.save(update_fields=["minimum_quantity"])
        BranchInventory.objects.create(
            branch=self.branch, product=self.prod2, quantity=0
        )

    def test_low_stock_report_finds_low_items(self):
        data = low_stock_report()
        self.assertEqual(len(data), 2)
        names = {r["product_name"] for r in data}
        self.assertIn("Item", names)
        self.assertIn("Item2", names)

    def test_low_stock_report_excludes_healthy_stock(self):
        branch2 = Branch.objects.create(name="C", code="C01")
        add_inventory(branch2, self.prod, 50)
        inv = BranchInventory.objects.get(branch=branch2, product=self.prod)
        inv.minimum_quantity = 10
        inv.save(update_fields=["minimum_quantity"])
        data = low_stock_report()
        healthy = [r for r in data if r["product_name"] == "Item" and r["branch_name"] == "C"]
        self.assertEqual(len(healthy), 0)


class SalesReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="sales@test.com", password="testpass123")
        self.branch = Branch.objects.create(name="Sales Branch", code="SLS")
        self.cat = create_category({"name": "Cat"})
        self.product = create_product({
            "category": self.cat.pk, "name": "Sale Item", "slug": "sale", "sku": "SL", "price": 30,
        })
        self._create_order(timezone.now() - timedelta(days=2))

    def _create_order(self, paid_at):
        pending = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=30,
            total=30,
            expires_at=paid_at + timedelta(minutes=30),
        )
        payment = StorePayment.objects.create(
            pending_order=pending,
            amount=30,
            transaction_reference=f"STORE-sls-{paid_at.timestamp()}",
            status=PaymentStatus.PAID,
        )
        pending.payment_reference = payment.transaction_reference
        pending.save(update_fields=["payment_reference"])
        add_inventory(self.branch, self.product, 1)
        PendingOrderItem.objects.create(
            pending_order=pending,
            product=self.product,
            quantity=1,
            unit_price=30,
            subtotal=30,
        )
        order = create_order_from_pending_order(pending)
        Order.objects.filter(pk=order.pk).update(paid_at=paid_at)
        return order

    def test_sales_report_returns_data(self):
        data = sales_report()
        self.assertGreater(len(data), 0)

    def test_sales_report_excludes_cancelled(self):
        order = Order.objects.first()
        change_order_status(order, OrderStatus.CANCELLED, actor=self.user)
        data = sales_report()
        self.assertEqual(len(data), 0)

    def test_sales_report_by_branch(self):
        data = sales_report(branch_id=self.branch.pk)
        self.assertGreater(len(data), 0)

    def test_sales_report_no_data_for_future(self):
        future = timezone.now() + timedelta(days=365)
        data = sales_report(start_date=future, end_date=future + timedelta(days=1))
        self.assertEqual(len(data), 0)


class OrderReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="ordrpt@test.com", password="testpass123")
        self.branch = Branch.objects.create(name="Order Branch", code="ORD")
        self.cat = create_category({"name": "Cat"})
        self.product = create_product({
            "category": self.cat.pk, "name": "Ord Item", "slug": "ord", "sku": "ORD", "price": 25,
        })
        self.order = _create_paid_order(self.user, self.branch, self.cat, [
            {"product": self.product, "quantity": 2, "subtotal": 50},
        ])

    def test_order_report_returns_data(self):
        data = order_report()
        self.assertGreater(len(data), 0)

    def test_order_report_by_status(self):
        data = order_report(status=OrderStatus.PAID)
        self.assertGreater(len(data), 0)

    def test_order_report_by_branch(self):
        data = order_report(branch_id=self.branch.pk)
        self.assertGreater(len(data), 0)

    def test_order_report_no_data_for_past(self):
        past = timezone.now() - timedelta(days=365)
        data = order_report(start_date=past - timedelta(days=10), end_date=past)
        self.assertEqual(len(data), 0)


class BranchSalesReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="bsr@test.com", password="testpass123")
        self.branch = Branch.objects.create(name="BSR Branch", code="BSR")
        self.branch2 = Branch.objects.create(name="BSR Branch2", code="BS2")
        self.cat = create_category({"name": "Cat"})
        self.prod = create_product({
            "category": self.cat.pk, "name": "BSR Item", "slug": "bsr", "sku": "BSR", "price": 40,
        })
        self.prod2 = create_product({
            "category": self.cat.pk, "name": "BSR Item2", "slug": "bsr2", "sku": "BS2", "price": 60,
        })
        _create_paid_order(self.user, self.branch, self.cat, [
            {"product": self.prod, "quantity": 1, "subtotal": 40},
        ])
        _create_paid_order(self.user, self.branch2, self.cat, [
            {"product": self.prod2, "quantity": 1, "subtotal": 60},
        ])

    def test_branch_sales_report_all(self):
        data = branch_sales_report()
        branches = {r["branch_name"] for r in data}
        self.assertIn("BSR Branch", branches)
        self.assertIn("BSR Branch2", branches)

    def test_branch_sales_report_by_branch(self):
        data = branch_sales_report(branch_id=self.branch.pk)
        for row in data:
            self.assertEqual(row["branch_id"], str(self.branch.pk))

    def test_branch_sales_report_fields(self):
        data = branch_sales_report()
        row = data[0]
        self.assertIn("period", row)
        self.assertIn("branch_name", row)
        self.assertIn("order_count", row)
        self.assertIn("total_revenue", row)
