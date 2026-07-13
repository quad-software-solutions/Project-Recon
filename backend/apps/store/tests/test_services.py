from django.test import TestCase
from rest_framework.exceptions import NotFound, ValidationError

from apps.store.models import (
    Product,
    ProductCategory,
    ProductImage,
    ShoppingCart,
    ShoppingCartItem,
)
from apps.store.services.category_service import (
    activate_category,
    create_category,
    deactivate_category,
    get_category_or_404,
    list_active_categories,
    list_categories,
    update_category,
)
from apps.store.services.product_service import (
    activate_product,
    archive_product,
    create_product,
    deactivate_product,
    get_product_or_404,
    list_active_products,
    list_products,
    restore_product,
    update_product,
)
from apps.store.services.product_image_service import (
    delete_image,
    get_image_or_404,
    list_product_images,
    reorder_images,
    set_primary_image,
    upload_image,
)
from apps.store.services.branch_inventory_service import (
    add_inventory,
    correct_inventory,
    get_branch_inventory,
    get_product_availability,
    reduce_inventory,
    transfer_inventory,
    validate_stock,
)
from apps.store.models.order import Order, OrderItem, OrderStatus
from apps.store.models.payment import StorePayment
from apps.store.models.pending_order import PendingOrder, PendingOrderItem
from apps.store.services.checkout_service import checkout
from apps.store.services.payment_service import (
    initialize_store_payment,
    verify_store_payment,
)
from apps.store.services.order_service import (
    change_order_status,
    create_order_from_pending_order,
    generate_order_number,
    get_admin_orders,
    get_order_or_404,
    get_user_orders,
)
from apps.store.services.pending_order_service import (
    expire_expired_pending_orders,
    get_pending_order_or_404,
)
from apps.store.services.shopping_cart_service import (
    add_to_cart,
    clear_cart,
    delete_expired_carts,
    get_or_create_cart,
    remove_from_cart,
    update_cart_item_quantity,
)


class CategoryServiceTest(TestCase):
    def test_create_category(self):
        category = create_category({"name": "Electronics", "description": "Devices"})
        self.assertEqual(category.name, "Electronics")
        self.assertTrue(category.is_active)

    def test_create_duplicate_name_raises_error(self):
        create_category({"name": "Robotics"})
        with self.assertRaises(ValidationError):
            create_category({"name": "Robotics"})

    def test_create_duplicate_case_insensitive(self):
        create_category({"name": "Robotics"})
        with self.assertRaises(ValidationError):
            create_category({"name": "robotics"})

    def test_get_or_404_raises_not_found(self):
        with self.assertRaises(NotFound):
            get_category_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_categories(self):
        create_category({"name": "A"})
        create_category({"name": "B"})
        self.assertEqual(list_categories().count(), 2)

    def test_list_active_categories(self):
        cat_a = create_category({"name": "Active A"})
        cat_b = create_category({"name": "Active B"})
        deactivate_category(cat_b)
        active = list_active_categories()
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().name, "Active A")

    def test_update_category(self):
        category = create_category({"name": "Old Name"})
        updated = update_category(category, {"name": "New Name"})
        self.assertEqual(updated.name, "New Name")

    def test_activate_deactivate(self):
        category = create_category({"name": "Toggle"})
        self.assertTrue(category.is_active)
        deactivate_category(category)
        self.assertFalse(
            ProductCategory.objects.get(pk=category.pk).is_active
        )
        activate_category(category)
        self.assertTrue(
            ProductCategory.objects.get(pk=category.pk).is_active
        )


class ProductServiceTest(TestCase):
    def setUp(self):
        self.category = create_category({"name": "Kits"})

    def test_create_product(self):
        product = create_product({
            "category": self.category.pk,
            "name": "Robot Kit",
            "slug": "robot-kit",
            "sku": "KIT-001",
            "price": 99.99,
        })
        self.assertEqual(product.name, "Robot Kit")
        self.assertTrue(product.is_active)
        self.assertIsNone(product.archived_at)

    def test_create_product_inactive_category_raises_error(self):
        deactivate_category(self.category)
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Bad",
                "slug": "bad",
                "sku": "BAD",
                "price": 10,
            })

    def test_create_duplicate_sku_raises_error(self):
        create_product({
            "category": self.category.pk,
            "name": "Kit A",
            "slug": "kit-a",
            "sku": "SAME",
            "price": 10,
        })
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Kit B",
                "slug": "kit-b",
                "sku": "SAME",
                "price": 20,
            })

    def test_create_duplicate_slug_raises_error(self):
        create_product({
            "category": self.category.pk,
            "name": "Kit A",
            "slug": "same-slug",
            "sku": "SKU-A",
            "price": 10,
        })
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Kit B",
                "slug": "same-slug",
                "sku": "SKU-B",
                "price": 20,
            })

    def test_get_or_404_raises_not_found(self):
        with self.assertRaises(NotFound):
            get_product_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_products(self):
        create_product({
            "category": self.category.pk, "name": "A", "slug": "a", "sku": "A", "price": 10,
        })
        create_product({
            "category": self.category.pk, "name": "B", "slug": "b", "sku": "B", "price": 20,
        })
        self.assertEqual(list_products().count(), 2)

    def test_list_active_excludes_archived_and_inactive(self):
        p1 = create_product({
            "category": self.category.pk, "name": "Active", "slug": "active", "sku": "ACT", "price": 10,
        })
        p2 = create_product({
            "category": self.category.pk, "name": "Archived", "slug": "archived", "sku": "ARC", "price": 20,
        })
        archive_product(p2)
        deactivate_product(p1)
        self.assertEqual(list_active_products().count(), 0)
        p3 = create_product({
            "category": self.category.pk, "name": "Available", "slug": "avail", "sku": "AVL", "price": 30,
        })
        self.assertEqual(list_active_products().count(), 1)

    def test_update_product(self):
        product = create_product({
            "category": self.category.pk, "name": "Old", "slug": "old", "sku": "OLD", "price": 10,
        })
        updated = update_product(product, {"name": "New", "price": 15})
        self.assertEqual(updated.name, "New")
        self.assertEqual(updated.price, 15)

    def test_archive_and_restore(self):
        product = create_product({
            "category": self.category.pk, "name": "Temp", "slug": "temp", "sku": "TMP", "price": 10,
        })
        archive_product(product)
        product.refresh_from_db()
        self.assertIsNotNone(product.archived_at)
        self.assertFalse(product.is_active)
        restore_product(product)
        product.refresh_from_db()
        self.assertIsNone(product.archived_at)
        self.assertTrue(product.is_active)

    def test_activate_archived_raises_error(self):
        product = create_product({
            "category": self.category.pk, "name": "Arch", "slug": "arch", "sku": "ARC", "price": 10,
        })
        archive_product(product)
        with self.assertRaises(ValidationError):
            activate_product(product)


class ProductImageServiceTest(TestCase):
    def setUp(self):
        category = create_category({"name": "Category"})
        self.product = create_product({
            "category": category.pk, "name": "Product", "slug": "product", "sku": "PRD", "price": 10,
        })

    def test_upload_image(self):
        img = upload_image(self.product, "store/products/test.jpg", alt_text="Test")
        self.assertEqual(img.product, self.product)
        self.assertEqual(img.display_order, 0)

    def test_upload_multiple_images_increments_order(self):
        img1 = upload_image(self.product, "store/products/a.jpg")
        img2 = upload_image(self.product, "store/products/b.jpg")
        self.assertEqual(img1.display_order, 0)
        self.assertEqual(img2.display_order, 1)

    def test_set_primary_demotes_previous(self):
        img1 = upload_image(self.product, "store/products/a.jpg", is_primary=True)
        img2 = upload_image(self.product, "store/products/b.jpg", is_primary=True)
        img1.refresh_from_db()
        self.assertFalse(img1.is_primary)
        self.assertTrue(
            ProductImage.objects.get(pk=img2.pk).is_primary
        )

    def test_delete_primary_promotes_next(self):
        img1 = upload_image(self.product, "store/products/a.jpg", is_primary=True)
        img2 = upload_image(self.product, "store/products/b.jpg")
        delete_image(img1)
        img2.refresh_from_db()
        self.assertTrue(img2.is_primary)

    def test_get_image_or_404(self):
        img = upload_image(self.product, "store/products/test.jpg")
        fetched = get_image_or_404(img.pk)
        self.assertEqual(fetched.pk, img.pk)

    def test_reorder_images(self):
        img1 = upload_image(self.product, "store/products/a.jpg")
        img2 = upload_image(self.product, "store/products/b.jpg")
        img3 = upload_image(self.product, "store/products/c.jpg")
        images = reorder_images(self.product, [img3.pk, img1.pk, img2.pk])
        self.assertEqual(images[0].pk, img3.pk)
        self.assertEqual(images[1].pk, img1.pk)
        self.assertEqual(images[2].pk, img2.pk)

    def test_list_product_images(self):
        upload_image(self.product, "store/products/a.jpg")
        upload_image(self.product, "store/products/b.jpg")
        self.assertEqual(list_product_images(self.product).count(), 2)


class BranchInventoryServiceTest(TestCase):
    def setUp(self):
        from apps.accounts.models import Branch

        category = create_category({"name": "Category"})
        self.product = create_product({
            "category": category.pk,
            "name": "Widget",
            "slug": "widget",
            "sku": "WDG",
            "price": 10,
        })
        self.branch_a = Branch.objects.create(name="Branch A", code="BA")
        self.branch_b = Branch.objects.create(name="Branch B", code="BB")

    def test_add_inventory_creates_record(self):
        inv = add_inventory(self.branch_a, self.product, 5)
        self.assertEqual(inv.quantity, 5)

    def test_add_inventory_accumulates(self):
        add_inventory(self.branch_a, self.product, 3)
        inv = add_inventory(self.branch_a, self.product, 7)
        self.assertEqual(inv.quantity, 10)

    def test_add_inventory_zero_raises_error(self):
        with self.assertRaises(ValidationError):
            add_inventory(self.branch_a, self.product, 0)

    def test_reduce_inventory(self):
        add_inventory(self.branch_a, self.product, 10)
        inv = reduce_inventory(self.branch_a, self.product, 3)
        self.assertEqual(inv.quantity, 7)

    def test_reduce_insufficient_stock_raises_error(self):
        add_inventory(self.branch_a, self.product, 2)
        with self.assertRaises(ValidationError):
            reduce_inventory(self.branch_a, self.product, 5)

    def test_reduce_nonexistent_raises_error(self):
        with self.assertRaises(ValidationError):
            reduce_inventory(self.branch_a, self.product, 1)

    def test_correct_inventory(self):
        add_inventory(self.branch_a, self.product, 10)
        inv = correct_inventory(self.branch_a, self.product, 25)
        self.assertEqual(inv.quantity, 25)

    def test_correct_inventory_to_zero(self):
        add_inventory(self.branch_a, self.product, 10)
        inv = correct_inventory(self.branch_a, self.product, 0)
        self.assertEqual(inv.quantity, 0)

    def test_correct_negative_raises_error(self):
        with self.assertRaises(ValidationError):
            correct_inventory(self.branch_a, self.product, -5)

    def test_transfer_inventory(self):
        add_inventory(self.branch_a, self.product, 10)
        result = transfer_inventory(self.branch_a, self.branch_b, self.product, 4)
        self.assertEqual(result["source"].quantity, 6)
        self.assertEqual(result["destination"].quantity, 4)

    def test_transfer_insufficient_stock_raises_error(self):
        add_inventory(self.branch_a, self.product, 1)
        with self.assertRaises(ValidationError):
            transfer_inventory(self.branch_a, self.branch_b, self.product, 5)

    def test_transfer_same_branch_raises_error(self):
        add_inventory(self.branch_a, self.product, 5)
        with self.assertRaises(ValidationError):
            transfer_inventory(self.branch_a, self.branch_a, self.product, 2)

    def test_get_branch_inventory(self):
        add_inventory(self.branch_a, self.product, 3)
        qs = get_branch_inventory(self.branch_a)
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().quantity, 3)

    def test_get_product_availability(self):
        add_inventory(self.branch_a, self.product, 5)
        add_inventory(self.branch_b, self.product, 8)
        qs = get_product_availability(self.product)
        self.assertEqual(qs.count(), 2)

    def test_validate_stock(self):
        add_inventory(self.branch_a, self.product, 10)
        self.assertTrue(validate_stock(self.branch_a, self.product, 5))
        self.assertFalse(validate_stock(self.branch_a, self.product, 15))
        self.assertFalse(validate_stock(self.branch_b, self.product, 1))


class ShoppingCartServiceTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="cart@test.com",
            password="testpass123",
            first_name="Cart",
            last_name="User",
        )
        self.session_key = "test-session-xyz"
        self.category = create_category({"name": "Category"})
        self.product = create_product({
            "category": self.category.pk,
            "name": "Widget",
            "slug": "widget",
            "sku": "WDG",
            "price": 10,
        })
        self.branch = Branch.objects.create(name="Branch", code="BR")
        add_inventory(self.branch, self.product, 50)

    def test_get_or_create_cart_for_user(self):
        cart = get_or_create_cart(user=self.user)
        self.assertEqual(cart.user, self.user)
        self.assertIsNotNone(cart.expires_at)

    def test_get_or_create_cart_returns_existing(self):
        cart1 = get_or_create_cart(user=self.user)
        cart2 = get_or_create_cart(user=self.user)
        self.assertEqual(cart1.pk, cart2.pk)

    def test_get_or_create_cart_for_session(self):
        cart = get_or_create_cart(session_key=self.session_key)
        self.assertEqual(cart.session_key, self.session_key)
        self.assertIsNotNone(cart.expires_at)

    def test_get_or_create_cart_requires_user_or_session(self):
        with self.assertRaises(ValidationError):
            get_or_create_cart()

    def test_add_to_cart(self):
        cart = get_or_create_cart(user=self.user)
        item = add_to_cart(cart, self.product, self.branch, 3)
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.branch, self.branch)

    def test_add_to_cart_accumulates_quantity(self):
        cart = get_or_create_cart(user=self.user)
        add_to_cart(cart, self.product, self.branch, 2)
        item = add_to_cart(cart, self.product, self.branch, 3)
        self.assertEqual(item.quantity, 5)

    def test_add_to_cart_invalid_quantity(self):
        cart = get_or_create_cart(user=self.user)
        with self.assertRaises(ValidationError):
            add_to_cart(cart, self.product, self.branch, 0)

    def test_add_to_cart_insufficient_stock(self):
        cart = get_or_create_cart(user=self.user)
        with self.assertRaises(ValidationError):
            add_to_cart(cart, self.product, self.branch, 999)

    def test_remove_from_cart(self):
        cart = get_or_create_cart(user=self.user)
        item = add_to_cart(cart, self.product, self.branch, 2)
        self.assertEqual(ShoppingCartItem.objects.count(), 1)
        remove_from_cart(cart, item.pk)
        self.assertEqual(ShoppingCartItem.objects.count(), 0)

    def test_remove_nonexistent_item(self):
        cart = get_or_create_cart(user=self.user)
        with self.assertRaises(NotFound):
            remove_from_cart(cart, "00000000-0000-0000-0000-000000000000")

    def test_update_cart_item_quantity(self):
        cart = get_or_create_cart(user=self.user)
        item = add_to_cart(cart, self.product, self.branch, 2)
        updated = update_cart_item_quantity(cart, item.pk, 5)
        self.assertEqual(updated.quantity, 5)

    def test_update_cart_item_invalid_quantity(self):
        cart = get_or_create_cart(user=self.user)
        item = add_to_cart(cart, self.product, self.branch, 2)
        with self.assertRaises(ValidationError):
            update_cart_item_quantity(cart, item.pk, 0)

    def test_clear_cart(self):
        cart = get_or_create_cart(user=self.user)
        add_to_cart(cart, self.product, self.branch, 2)
        add_to_cart(cart, self.product, self.branch, 3)  # accumulates, not duplicate
        clear_cart(cart)
        self.assertEqual(ShoppingCartItem.objects.count(), 0)

    def test_delete_expired_carts(self):
        from datetime import timedelta

        from django.utils import timezone

        expired = ShoppingCart.objects.create(
            user=self.user,
            expires_at=timezone.now() - timedelta(days=1),
        )
        count = delete_expired_carts()
        self.assertEqual(count, 1)
        self.assertFalse(ShoppingCart.objects.filter(pk=expired.pk).exists())


class CheckoutServiceTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="checkout@test.com",
            password="testpass123",
            first_name="Check",
            last_name="Out",
        )
        self.session_key = "checkout-session"
        self.category = create_category({"name": "Category"})
        self.product = create_product({
            "category": self.category.pk,
            "name": "Widget",
            "slug": "widget",
            "sku": "WDG",
            "price": 25.00,
        })
        self.product2 = create_product({
            "category": self.category.pk,
            "name": "Gadget",
            "slug": "gadget",
            "sku": "GDG",
            "price": 15.00,
        })
        self.branch = Branch.objects.create(name="Branch", code="BR")
        add_inventory(self.branch, self.product, 50)
        add_inventory(self.branch, self.product2, 20)
        self.cart = get_or_create_cart(user=self.user)
        add_to_cart(self.cart, self.product, self.branch, 3)
        add_to_cart(self.cart, self.product2, self.branch, 2)

    def test_checkout_success(self):
        order = checkout(self.cart, self.branch)
        self.assertEqual(order.branch, self.branch)
        self.assertEqual(order.user, self.user)
        items = order.items.all()
        self.assertEqual(len(items), 2)
        self.assertEqual(float(order.subtotal), 105.00)
        self.assertEqual(float(order.total), 105.00)
        self.assertIsNone(order.payment_reference)

    def test_checkout_empty_cart(self):
        from apps.store.services.shopping_cart_service import clear_cart

        clear_cart(self.cart)
        with self.assertRaises(ValidationError):
            checkout(self.cart, self.branch)

    def test_checkout_insufficient_stock(self):
        from apps.store.models import BranchInventory

        inv = BranchInventory.objects.get(branch=self.branch, product=self.product)
        inv.quantity = 1
        inv.save(update_fields=["quantity"])
        with self.assertRaises(ValidationError) as ctx:
            checkout(self.cart, self.branch)
        self.assertIn("Insufficient stock", str(ctx.exception))

    def test_checkout_inactive_product(self):
        from apps.store.services.product_service import deactivate_product

        deactivate_product(self.product)
        with self.assertRaises(ValidationError):
            checkout(self.cart, self.branch)

    def test_checkout_clears_cart(self):
        checkout(self.cart, self.branch)
        self.assertEqual(self.cart.items.count(), 0)

    def test_checkout_snapshots_prices(self):
        order = checkout(self.cart, self.branch)
        for item in order.items.all():
            self.assertEqual(
                float(item.unit_price), float(item.product.price)
            )

    def test_checkout_guest_with_guest_info(self):
        guest_cart = get_or_create_cart(session_key="guest-checkout")
        add_to_cart(guest_cart, self.product, self.branch, 1)
        order = checkout(
            guest_cart,
            self.branch,
            guest_info={
                "name": "Guest",
                "email": "guest@test.com",
                "phone": "+251911111111",
            },
        )
        self.assertIsNone(order.user)
        self.assertEqual(order.guest_name, "Guest")
        self.assertEqual(order.guest_email, "guest@test.com")


class PendingOrderServiceTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="pos@test.com",
            password="testpass123",
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")

    def test_get_pending_order_or_404(self):
        from datetime import timedelta

        from django.utils import timezone

        order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=50,
            total=50,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        fetched = get_pending_order_or_404(order.pk)
        self.assertEqual(fetched.pk, order.pk)

    def test_get_pending_order_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_pending_order_or_404("00000000-0000-0000-0000-000000000000")

    def test_expire_expired_pending_orders(self):
        from datetime import timedelta

        from django.utils import timezone

        expired = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=50,
            total=50,
            expires_at=timezone.now() - timedelta(minutes=5),
        )
        active = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=30,
            total=30,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        count = expire_expired_pending_orders()
        self.assertEqual(count, 1)
        self.assertFalse(PendingOrder.objects.filter(pk=expired.pk).exists())
        self.assertTrue(PendingOrder.objects.filter(pk=active.pk).exists())


class StorePaymentServiceTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        self.user = User.objects.create_user(
            email="paytest@test.com",
            password="testpass123",
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")
        self.order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=100,
            total=100,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

    def test_initialize_payment_creates_record(self):
        from unittest.mock import patch

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-test-ref-123",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            payment = initialize_store_payment(
                self.order,
                callback_url="https://example.com/webhook/",
            )
        self.assertEqual(payment.pending_order, self.order)
        self.assertEqual(float(payment.amount), 100.00)
        self.assertTrue(payment.transaction_reference.startswith("STORE-"))
        self.assertIsNotNone(payment.id)

    def test_initialize_payment_raises_if_already_exists(self):
        from unittest.mock import patch

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-test-ref-456",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            initialize_store_payment(
                self.order,
                callback_url="https://example.com/webhook/",
            )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            initialize_store_payment(
                self.order,
                callback_url="https://example.com/webhook/",
            )

    def test_verify_store_payment_allows_retry_on_pending(self):
        from unittest.mock import patch

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-test-ref-789",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            initialize_store_payment(
                self.order,
                callback_url="https://example.com/webhook/",
            )
        payment = self.order.payment
        payment.status = "PENDING"
        payment.save(update_fields=["status"])

        with patch(
            "apps.store.services.payment_service.shared_verify_payment"
        ) as mock_verify:
            mock_verify.return_value = {
                "status": "pending",
                "reference": payment.transaction_reference,
                "provider": "chapa",
                "amount": 100.00,
                "currency": "ETB",
            }
            result = verify_store_payment(payment.transaction_reference)
        self.assertEqual(result.status, "PENDING")

    def test_verify_store_payment_invalid_reference(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            verify_store_payment("invalid-ref")

    def test_verify_store_payment_not_found(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            verify_store_payment("STORE-abc12345-def123456789")


class OrderServiceTest(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.models import Branch, User

        from apps.store.constants import PaymentStatus

        self.user = User.objects.create_user(
            email="ordersvc@test.com",
            password="testpass123",
        )
        self.branch = Branch.objects.create(name="Branch", code="BR")
        self.pending_order = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=100.00,
            total=115.00,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.payment = StorePayment.objects.create(
            pending_order=self.pending_order,
            amount=115.00,
            transaction_reference="STORE-ordsvc-ref-001",
            status=PaymentStatus.PAID,
        )
        self.pending_order.payment_reference = "STORE-ordsvc-ref-001"
        self.pending_order.save(update_fields=["payment_reference"])

    def test_generate_order_number(self):
        num = generate_order_number(self.branch)
        self.assertTrue(num.startswith(f"ORD-{self.branch.code}-"))
        self.assertEqual(len(num.split("-")[-1]), 6)

    def test_create_order_from_paid_pending_order(self):
        order = create_order_from_pending_order(self.pending_order, actor=self.user)
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.branch, self.branch)
        self.assertEqual(float(order.subtotal), 100.00)
        self.assertEqual(float(order.total), 115.00)
        self.assertEqual(order.status, OrderStatus.PAID)
        self.assertIsNotNone(order.paid_at)
        self.assertIsNotNone(order.order_number)
        self.assertTrue(
            order.order_number.startswith(f"ORD-{self.branch.code}-")
        )

    def test_create_order_idempotent(self):
        order1 = create_order_from_pending_order(self.pending_order, actor=self.user)
        order2 = create_order_from_pending_order(self.pending_order, actor=self.user)
        self.assertEqual(order1.pk, order2.pk)

    def test_create_order_unpaid_raises_error(self):
        from datetime import timedelta
        from django.utils import timezone
        unpaid = PendingOrder.objects.create(
            user=self.user,
            branch=self.branch,
            subtotal=50,
            total=50,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        StorePayment.objects.create(
            pending_order=unpaid,
            amount=50,
            transaction_reference="STORE-ordsvc-unpaid",
            status="PENDING",
        )
        with self.assertRaises(ValidationError):
            create_order_from_pending_order(unpaid)

    def test_create_order_with_items(self):
        category = ProductCategory.objects.create(name="Category")
        product = Product.objects.create(
            category=category, name="Item", slug="item", sku="ITEM", price=25
        )
        PendingOrderItem.objects.create(
            pending_order=self.pending_order,
            product=product,
            quantity=3,
            unit_price=25.00,
            subtotal=75.00,
        )
        product2 = Product.objects.create(
            category=category, name="Item2", slug="item2", sku="ITEM2", price=20
        )
        PendingOrderItem.objects.create(
            pending_order=self.pending_order,
            product=product2,
            quantity=2,
            unit_price=20.00,
            subtotal=40.00,
        )
        add_inventory(self.branch, product, 10)
        add_inventory(self.branch, product2, 5)
        order = create_order_from_pending_order(self.pending_order, actor=self.user)
        items = order.items.all()
        self.assertEqual(len(items), 2)

    def test_create_order_deducts_inventory(self):
        category = ProductCategory.objects.create(name="Category")
        product = Product.objects.create(
            category=category, name="Widget", slug="widget", sku="WDG", price=10
        )
        PendingOrderItem.objects.create(
            pending_order=self.pending_order,
            product=product,
            quantity=3,
            unit_price=10.00,
            subtotal=30.00,
        )
        add_inventory(self.branch, product, 10)
        create_order_from_pending_order(self.pending_order, actor=self.user)
        from apps.store.models import BranchInventory
        inv = BranchInventory.objects.get(branch=self.branch, product=product)
        self.assertEqual(inv.quantity, 7)

    def test_create_order_insufficient_stock_raises_error(self):
        category = ProductCategory.objects.create(name="Category")
        product = Product.objects.create(
            category=category, name="Widget", slug="widget", sku="WDG", price=10
        )
        PendingOrderItem.objects.create(
            pending_order=self.pending_order,
            product=product,
            quantity=10,
            unit_price=10.00,
            subtotal=100.00,
        )
        add_inventory(self.branch, product, 3)
        with self.assertRaises(ValidationError):
            create_order_from_pending_order(self.pending_order, actor=self.user)

    def test_get_order_or_404(self):
        order = create_order_from_pending_order(self.pending_order)
        fetched = get_order_or_404(order.pk)
        self.assertEqual(fetched.pk, order.pk)

    def test_get_order_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_order_or_404("00000000-0000-0000-0000-000000000000")

    def test_get_user_orders(self):
        order = create_order_from_pending_order(self.pending_order)
        qs = get_user_orders(self.user)
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().pk, order.pk)

    def test_get_user_orders_excludes_other_users(self):
        from apps.accounts.models import User

        other = User.objects.create_user(
            email="other@test.com", password="testpass123"
        )
        create_order_from_pending_order(self.pending_order)
        qs = get_user_orders(other)
        self.assertEqual(qs.count(), 0)

    def test_get_admin_orders(self):
        create_order_from_pending_order(self.pending_order)
        qs = get_admin_orders()
        self.assertEqual(qs.count(), 1)

    def test_change_order_status_valid_transition(self):
        order = create_order_from_pending_order(self.pending_order)
        change_order_status(order, OrderStatus.PREPARING, actor=self.user)
        updated = get_order_or_404(order.pk)
        self.assertEqual(updated.status, OrderStatus.PREPARING)
        history = updated.status_history.all()
        self.assertEqual(len(history), 2)
        self.assertEqual(history[1].previous_status, OrderStatus.PAID)
        self.assertEqual(history[1].new_status, OrderStatus.PREPARING)

    def test_change_order_status_invalid_transition(self):
        order = create_order_from_pending_order(self.pending_order)
        with self.assertRaises(ValidationError):
            change_order_status(order, OrderStatus.COMPLETED)

    def test_change_order_status_invalid_status(self):
        order = create_order_from_pending_order(self.pending_order)
        with self.assertRaises(ValidationError):
            change_order_status(order, "INVALID_STATUS")

    def test_change_order_status_to_completed_sets_completed_at(self):
        order = create_order_from_pending_order(self.pending_order)
        change_order_status(order, OrderStatus.PREPARING, actor=self.user)
        change_order_status(order, OrderStatus.READY_FOR_PICKUP, actor=self.user)
        change_order_status(order, OrderStatus.COMPLETED, actor=self.user)
        updated = get_order_or_404(order.pk)
        self.assertEqual(updated.status, OrderStatus.COMPLETED)
        self.assertIsNotNone(updated.completed_at)
