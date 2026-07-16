import uuid

from django.db import IntegrityError
from django.test import TestCase

from datetime import timedelta

from django.utils import timezone

from apps.store.models import (
    BranchInventory,
    Order,
    OrderItem,
    OrderStatusHistory,
    PendingOrder,
    PendingOrderItem,
    Product,
    ProductCategory,
    ProductImage,
    ShoppingCart,
    ShoppingCartItem,
    StorePayment,
)
from apps.store.models.order import OrderStatus


class ProductCategoryModelTest(TestCase):
    def test_create_category(self):
        category = ProductCategory.objects.create(name="Electronics", description="Electronic items")
        self.assertEqual(str(category), "Electronics")
        self.assertTrue(category.is_active)
        self.assertIsNotNone(category.id)
        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)

    def test_category_name_unique(self):
        ProductCategory.objects.create(name="Robotics")
        with self.assertRaises(IntegrityError):
            ProductCategory.objects.create(name="Robotics")

    def test_category_defaults(self):
        category = ProductCategory.objects.create(name="Books")
        self.assertIsNone(category.description)
        self.assertTrue(category.is_active)


class ProductModelTest(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(name="Kits")

    def test_create_product(self):
        product = Product.objects.create(
            category=self.category,
            name="Robot Kit",
            slug="robot-kit",
            sku="KIT-001",
            price=99.99,
        )
        self.assertEqual(str(product), "Robot Kit")
        self.assertEqual(product.category, self.category)
        self.assertTrue(product.is_active)
        self.assertIsNone(product.archived_at)
        self.assertIsNotNone(product.id)
        self.assertIsNotNone(product.created_at)

    def test_product_sku_unique(self):
        Product.objects.create(
            category=self.category, name="Kit A", slug="kit-a", sku="SKU-001", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit B",
                slug="kit-b",
                sku="SKU-001",
                price=20,
            )

    def test_product_slug_unique(self):
        Product.objects.create(
            category=self.category, name="Kit A", slug="same-slug", sku="SKU-A", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit B",
                slug="same-slug",
                sku="SKU-B",
                price=20,
            )

    def test_product_name_unique_within_category(self):
        Product.objects.create(
            category=self.category, name="Kit", slug="kit-1", sku="SKU-1", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit",
                slug="kit-2",
                sku="SKU-2",
                price=20,
            )

    def test_same_name_different_category_allowed(self):
        other_category = ProductCategory.objects.create(name="Other")
        Product.objects.create(
            category=self.category, name="Kit", slug="kit-1", sku="SKU-1", price=10
        )
        Product.objects.create(
            category=other_category,
            name="Kit",
            slug="kit-2",
            sku="SKU-2",
            price=20,
        )

    def test_product_price_gt_zero(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Free Item",
                slug="free-item",
                sku="FREE",
                price=0,
            )

    def test_category_protect_on_delete(self):
        product = Product.objects.create(
            category=self.category, name="Kit", slug="kit", sku="KIT", price=10
        )
        with self.assertRaises(IntegrityError):
            self.category.delete()
        self.assertTrue(Product.objects.filter(pk=product.pk).exists())


class ProductImageModelTest(TestCase):
    def setUp(self):
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Product", slug="product", sku="PRD", price=10
        )

    def test_create_image(self):
        image = ProductImage.objects.create(
            product=self.product,
            image="store/products/test.jpg",
            alt_text="Test image",
            is_primary=True,
            display_order=0,
        )
        self.assertEqual(image.product, self.product)
        self.assertTrue(image.is_primary)
        self.assertIsNotNone(image.id)
        self.assertIsNotNone(image.created_at)

    def test_only_one_primary_per_product(self):
        ProductImage.objects.create(
            product=self.product,
            image="store/products/primary.jpg",
            is_primary=True,
            display_order=0,
        )
        second = ProductImage.objects.create(
            product=self.product,
            image="store/products/secondary.jpg",
            is_primary=True,
            display_order=1,
        )
        primary_count = ProductImage.objects.filter(
            product=self.product, is_primary=True
        ).count()
        self.assertEqual(primary_count, 1)
        self.assertTrue(
            ProductImage.objects.get(pk=second.pk).is_primary
        )

    def test_unique_display_order_per_product(self):
        ProductImage.objects.create(
            product=self.product,
            image="store/products/a.jpg",
            display_order=0,
        )
        with self.assertRaises(IntegrityError):
            ProductImage.objects.create(
                product=self.product,
                image="store/products/b.jpg",
                display_order=0,
            )


class BranchInventoryModelTest(TestCase):
    def setUp(self):
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Product", slug="product", sku="PRD", price=10
        )
        from apps.accounts.models import Branch
        self.branch = Branch.objects.create(name="Test Branch", code="TB01")

    def test_create_inventory(self):
        inv = BranchInventory.objects.create(
            branch=self.branch, product=self.product, quantity=10
        )
        self.assertEqual(inv.quantity, 10)
        self.assertIsNone(inv.minimum_quantity)
        self.assertIsNotNone(inv.id)
        self.assertIsNotNone(inv.created_at)
        self.assertIsNotNone(inv.updated_at)

    def test_unique_branch_product(self):
        BranchInventory.objects.create(
            branch=self.branch, product=self.product, quantity=5
        )
        with self.assertRaises(IntegrityError):
            BranchInventory.objects.create(
                branch=self.branch, product=self.product, quantity=3
            )

    def test_quantity_gte_zero(self):
        with self.assertRaises(IntegrityError):
            BranchInventory.objects.create(
                branch=self.branch, product=self.product, quantity=-1
            )


class ShoppingCartModelTest(TestCase):
    def setUp(self):
        from apps.accounts.models import User

        self.user = User.objects.create_user(
            email="cart@test.com",
            password="testpass123",
            first_name="Cart",
            last_name="User",
        )

    def test_create_cart_for_user(self):
        cart = ShoppingCart.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30),
        )
        self.assertEqual(cart.user, self.user)
        self.assertIsNone(cart.session_key)
        self.assertIsNotNone(cart.id)
        self.assertIsNotNone(cart.created_at)
        self.assertIsNotNone(cart.updated_at)
        self.assertIn("cart@test.com", str(cart))

    def test_create_cart_for_session(self):
        cart = ShoppingCart.objects.create(
            session_key="test-session-abc",
            expires_at=timezone.now() + timedelta(days=30),
        )
        self.assertIsNone(cart.user)
        self.assertEqual(cart.session_key, "test-session-abc")
        self.assertIn("test-session-abc", str(cart))


class ShoppingCartItemModelTest(TestCase):
    def setUp(self):
        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="item@test.com", password="testpass123"
        )
        self.cart = ShoppingCart.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(days=30),
        )
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Item", slug="item", sku="ITEM", price=10
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")

    def test_create_cart_item(self):
        item = ShoppingCartItem.objects.create(
            cart=self.cart,
            product=self.product,
            branch=self.branch,
            quantity=2,
        )
        self.assertEqual(item.cart, self.cart)
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.branch, self.branch)
        self.assertEqual(item.quantity, 2)
        self.assertIsNotNone(item.id)
        self.assertIsNotNone(item.created_at)

    def test_unique_cart_product_branch(self):
        ShoppingCartItem.objects.create(
            cart=self.cart,
            product=self.product,
            branch=self.branch,
            quantity=1,
        )
        with self.assertRaises(IntegrityError):
            ShoppingCartItem.objects.create(
                cart=self.cart,
                product=self.product,
                branch=self.branch,
                quantity=2,
            )

    def test_quantity_gt_zero(self):
        with self.assertRaises(IntegrityError):
            ShoppingCartItem.objects.create(
                cart=self.cart,
                product=self.product,
                branch=self.branch,
                quantity=0,
            )


class PendingOrderModelTest(TestCase):
    def setUp(self):
        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="pending@test.com", password="testpass123"
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")

    def test_create_pending_order_for_user(self):
        order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=100.00,
            total=100.00,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.branch, self.branch)
        self.assertEqual(float(order.subtotal), 100.00)
        self.assertIsNotNone(order.id)
        self.assertIsNotNone(order.created_at)
        self.assertIn("pending@test.com", str(order))

    def test_create_pending_order_for_guest(self):
        order = PendingOrder.objects.create(
            branch=self.branch,
            subtotal=50.00,
            total=50.00,
            guest_name="Guest User",
            guest_email="guest@test.com",
            guest_phone="+251911111111",
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.assertIsNone(order.user)
        self.assertEqual(order.guest_name, "Guest User")
        self.assertEqual(order.guest_email, "guest@test.com")
        self.assertIn("Guest", str(order))


class PendingOrderItemModelTest(TestCase):
    def setUp(self):
        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(email="poi@test.com", password="testpass123")
        self.branch = Branch.objects.create(name="Branch", code="BR")
        self.order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=30.00,
            total=30.00,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Item", slug="item", sku="ITEM", price=15
        )

    def test_create_pending_order_item(self):
        item = PendingOrderItem.objects.create(
            pending_order=self.order,
            product=self.product,
            quantity=2,
            unit_price=15.00,
            subtotal=30.00,
        )
        self.assertEqual(item.pending_order, self.order)
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.quantity, 2)
        self.assertEqual(float(item.unit_price), 15.00)
        self.assertEqual(float(item.subtotal), 30.00)
        self.assertIsNotNone(item.id)


class StorePaymentModelTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="pay@test.com", password="testpass123"
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")
        self.order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=100.00,
            total=100.00,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

    def test_create_payment(self):
        from apps.store.constants import PaymentMethod

        payment = StorePayment.objects.create(
            pending_order=self.order,
            amount=100.00,
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="STORE-abc12345-def123456789",
            status="PENDING_VERIFICATION",
        )
        self.assertEqual(payment.pending_order, self.order)
        self.assertEqual(float(payment.amount), 100.00)
        self.assertEqual(payment.status, "PENDING_VERIFICATION")
        self.assertEqual(payment.payment_method, PaymentMethod.BANK_TRANSFER)
        self.assertIsNotNone(payment.id)
        self.assertIsNotNone(payment.created_at)
        self.assertIn("Payment for", str(payment))
        self.assertIn("Pending Verification", str(payment))

    def test_payment_status_choices(self):
        from django.utils import timezone

        from apps.store.constants import PaymentMethod

        payment = StorePayment.objects.create(
            pending_order=self.order,
            amount=100.00,
            payment_method=PaymentMethod.CASH,
            status="VERIFIED",
        )
        self.assertEqual(payment.status, "VERIFIED")
        self.assertEqual(payment.payment_method, PaymentMethod.CASH)

    def test_payment_verification_fields(self):
        from django.utils import timezone

        from apps.accounts.models import User

        verifier = User.objects.create_user(
            email="verifier@test.com", password="testpass123"
        )
        payment = StorePayment.objects.create(
            pending_order=self.order,
            amount=100.00,
            payment_method="CASH",
            status="VERIFIED",
            verified_by=verifier,
            verified_at=timezone.now(),
            verification_notes="Payment confirmed",
        )
        self.assertEqual(payment.status, "VERIFIED")
        self.assertEqual(payment.verified_by, verifier)
        self.assertIsNotNone(payment.verified_at)
        self.assertEqual(payment.verification_notes, "Payment confirmed")


class OrderModelTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="order@test.com", password="testpass123"
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")
        self.order = Order.objects.create(
            order_number="ORD-BR-2026-000001",
            user=self.user,
            branch=self.branch,
            payment_reference="STORE-pay-ref-001",
            subtotal=100.00,
            total=115.00,
            status=OrderStatus.PAID,
            paid_at=timezone.now(),
        )

    def test_create_order(self):
        self.assertEqual(self.order.order_number, "ORD-BR-2026-000001")
        self.assertEqual(self.order.user, self.user)
        self.assertEqual(self.order.branch, self.branch)
        self.assertEqual(float(self.order.subtotal), 100.00)
        self.assertEqual(float(self.order.total), 115.00)
        self.assertEqual(self.order.status, OrderStatus.PAID)
        self.assertIsNotNone(self.order.id)
        self.assertIsNotNone(self.order.paid_at)
        self.assertIsNotNone(self.order.created_at)
        self.assertIn("ORD-BR-2026-000001", str(self.order))

    def test_order_item_creation(self):
        category = ProductCategory.objects.create(name="Category")
        product = Product.objects.create(
            category=category, name="Item", slug="item", sku="ITEM", price=25
        )
        item = OrderItem.objects.create(
            order=self.order,
            product=product,
            product_name=product.name,
            sku=product.sku,
            quantity=3,
            unit_price=25.00,
            subtotal=75.00,
        )
        self.assertEqual(item.order, self.order)
        self.assertEqual(item.product_name, "Item")
        self.assertEqual(item.quantity, 3)
        self.assertIn("Item x3", str(item))

    def test_order_status_history_creation(self):
        history = OrderStatusHistory.objects.create(
            order=self.order,
            previous_status=None,
            new_status=OrderStatus.PAID,
            changed_by=self.user,
            notes="Created",
        )
        self.assertEqual(history.order, self.order)
        self.assertIsNone(history.previous_status)
        self.assertEqual(history.new_status, OrderStatus.PAID)
        self.assertEqual(history.changed_by, self.user)
        self.assertIsNotNone(history.changed_at)
        self.assertIn("(none) → PAID", str(history))

    def test_order_non_unique_payment_reference(self):
        Order.objects.create(
            order_number="ORD-BR-2026-000002",
            user=self.user,
            branch=self.branch,
            payment_reference="STORE-pay-ref-001",
            subtotal=50,
            total=50,
            status=OrderStatus.PAID,
            paid_at=timezone.now(),
        )
        self.assertEqual(
            Order.objects.filter(payment_reference="STORE-pay-ref-001").count(), 2
        )

    def test_order_cancelled_and_refunded_timestamps(self):
        from django.utils import timezone
        now = timezone.now()
        self.order.cancelled_at = now
        self.order.refunded_at = now
        self.order.save(update_fields=["cancelled_at", "refunded_at"])
        self.order.refresh_from_db()
        self.assertIsNotNone(self.order.cancelled_at)
        self.assertIsNotNone(self.order.refunded_at)
