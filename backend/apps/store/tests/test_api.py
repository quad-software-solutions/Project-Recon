import uuid

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.store.models import Order, Product, ProductCategory, ProductImage
from apps.store.services.category_service import (
    create_category,
    deactivate_category,
)
from apps.store.services.product_service import (
    archive_product,
    create_product,
)


@override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=False)
class StoreApiTestCase(APITestCase):
    base_url = "/api/v1/store"

    def setUp(self):
        self._old_throttle_rates = SimpleRateThrottle.THROTTLE_RATES
        SimpleRateThrottle.THROTTLE_RATES = {
            **SimpleRateThrottle.THROTTLE_RATES,
            "anon_login": "1000/min",
        }

        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)
        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.category = create_category({"name": "Electronics"})
        self.inactive_category = create_category({"name": "Discontinued"})
        deactivate_category(self.inactive_category)

        self.product = create_product({
            "category": self.category.pk,
            "name": "Robot Kit",
            "slug": "robot-kit",
            "sku": "KIT-001",
            "price": 99.99,
        })
        self.archived_product = create_product({
            "category": self.category.pk,
            "name": "Old Kit",
            "slug": "old-kit",
            "sku": "OLD-001",
            "price": 49.99,
        })
        archive_product(self.archived_product)

    def tearDown(self):
        SimpleRateThrottle.THROTTLE_RATES = self._old_throttle_rates
        super().tearDown()

    def _auth(self, user):
        resp = self.client.post(
            "/api/v1/accounts/login/",
            {"email": user.email, "password": self.password},
            format="json",
        )
        token = resp.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # --- Public Category Endpoints ---

    def test_public_list_categories(self):
        resp = self.client.get(f"{self.base_url}/categories/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [c["name"] for c in resp.data]
        self.assertIn("Electronics", names)
        self.assertNotIn("Discontinued", names)

    def test_public_category_detail(self):
        resp = self.client.get(f"{self.base_url}/categories/{self.category.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Electronics")

    def test_public_category_detail_not_found(self):
        resp = self.client.get(
            f"{self.base_url}/categories/{uuid.uuid4()}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # --- Public Product Endpoints ---

    def test_public_list_products(self):
        resp = self.client.get(f"{self.base_url}/products/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in resp.data]
        self.assertIn("Robot Kit", names)
        self.assertNotIn("Old Kit", names)

    def test_public_product_detail(self):
        resp = self.client.get(f"{self.base_url}/products/{self.product.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Robot Kit")

    def test_public_product_detail_not_found(self):
        resp = self.client.get(
            f"{self.base_url}/products/{uuid.uuid4()}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # --- Admin Category Endpoints ---

    def test_admin_create_category(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/categories/",
            {"name": "Books"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "Books")

    def test_admin_create_category_unauthenticated(self):
        resp = self.client.post(
            f"{self.base_url}/admin/categories/",
            {"name": "Books"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_create_category_forbidden_for_branch_manager(self):
        self._auth(self.branch_manager)
        resp = self.client.post(
            f"{self.base_url}/admin/categories/",
            {"name": "Books"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_list_categories_includes_inactive(self):
        self._auth(self.super_admin)
        resp = self.client.get(f"{self.base_url}/admin/categories/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [c["name"] for c in resp.data]
        self.assertIn("Electronics", names)
        self.assertIn("Discontinued", names)

    def test_admin_update_category(self):
        self._auth(self.super_admin)
        resp = self.client.put(
            f"{self.base_url}/admin/categories/{self.category.pk}/",
            {"name": "Updated Electronics"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Updated Electronics")

    def test_admin_activate_category(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/categories/{self.inactive_category.pk}/activate/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["is_active"])

    def test_admin_deactivate_category(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/categories/{self.category.pk}/deactivate/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["is_active"])

    # --- Admin Product Endpoints ---

    def test_admin_create_product(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/products/",
            {
                "category": str(self.category.pk),
                "name": "New Product",
                "slug": "new-product",
                "sku": "NEW-001",
                "price": 25.00,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "New Product")

    def test_admin_create_product_forbidden(self):
        self._auth(self.student)
        resp = self.client.post(
            f"{self.base_url}/admin/products/",
            {
                "category": str(self.category.pk),
                "name": "New",
                "slug": "new",
                "sku": "NEW",
                "price": 10,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_list_products(self):
        self._auth(self.super_admin)
        resp = self.client.get(f"{self.base_url}/admin/products/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in resp.data]
        self.assertIn("Robot Kit", names)
        self.assertIn("Old Kit", names)

    def test_admin_update_product(self):
        self._auth(self.super_admin)
        resp = self.client.put(
            f"{self.base_url}/admin/products/{self.product.pk}/",
            {
                "category": str(self.category.pk),
                "name": "Updated Kit",
                "slug": "robot-kit",
                "sku": "KIT-001",
                "price": 89.99,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Updated Kit")
        self.assertEqual(float(resp.data["price"]), 89.99)

    def test_admin_archive_product(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/products/{self.product.pk}/archive/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resp.data["archived_at"])
        self.assertFalse(resp.data["is_active"])

    def test_admin_restore_product(self):
        self._auth(self.super_admin)
        self.client.post(
            f"{self.base_url}/admin/products/{self.archived_product.pk}/archive/",
        )
        resp = self.client.post(
            f"{self.base_url}/admin/products/{self.archived_product.pk}/restore/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp.data["archived_at"])
        self.assertTrue(resp.data["is_active"])

    def test_admin_activate_product(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/products/{self.product.pk}/activate/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["is_active"])

    def test_admin_deactivate_product(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/products/{self.product.pk}/deactivate/",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["is_active"])

    def test_public_product_hides_archived(self):
        self._auth(self.super_admin)
        self.client.post(
            f"{self.base_url}/admin/products/{self.archived_product.pk}/archive/",
        )
        self.client.credentials()
        resp = self.client.get(f"{self.base_url}/products/")
        names = [p["name"] for p in resp.data]
        self.assertNotIn("Old Kit", names)

    # --- Public Inventory Endpoints ---

    def test_public_list_inventory_by_branch(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        resp = self.client.get(
            f"{self.base_url}/inventory/?branch={self.branch.pk}"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["quantity"], 10)

    def test_public_list_inventory_missing_branch(self):
        resp = self.client.get(f"{self.base_url}/inventory/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_product_availability(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 5)
        resp = self.client.get(
            f"{self.base_url}/inventory/availability/{self.product.pk}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    # --- Admin Inventory Endpoints ---

    def test_admin_create_inventory(self):
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/inventory/",
            {
                "branch": str(self.branch.pk),
                "product": str(self.product.pk),
                "quantity": 20,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["quantity"], 20)

    def test_admin_list_inventory(self):
        self._auth(self.super_admin)
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 15)
        resp = self.client.get(f"{self.base_url}/admin/inventory/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_admin_inventory_branch_manager_can_access(self):
        self._auth(self.branch_manager)
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 7)
        resp = self.client.get(f"{self.base_url}/admin/inventory/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_inventory_student_forbidden(self):
        self._auth(self.student)
        resp = self.client.get(f"{self.base_url}/admin/inventory/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_inventory_add(self):
        self._auth(self.super_admin)
        from apps.store.services.branch_inventory_service import add_inventory

        inv = add_inventory(self.branch, self.product, 5)
        resp = self.client.post(
            f"{self.base_url}/admin/inventory/{inv.pk}/add/",
            {"quantity": 10},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["quantity"], 15)

    def test_admin_inventory_reduce(self):
        self._auth(self.super_admin)
        from apps.store.services.branch_inventory_service import add_inventory

        inv = add_inventory(self.branch, self.product, 20)
        resp = self.client.post(
            f"{self.base_url}/admin/inventory/{inv.pk}/reduce/",
            {"quantity": 5},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["quantity"], 15)

    def test_admin_inventory_correct(self):
        self._auth(self.super_admin)
        from apps.store.services.branch_inventory_service import add_inventory

        inv = add_inventory(self.branch, self.product, 10)
        resp = self.client.post(
            f"{self.base_url}/admin/inventory/{inv.pk}/correct/",
            {"quantity": 50},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["quantity"], 50)

    def test_admin_inventory_transfer(self):
        self._auth(self.super_admin)
        from apps.store.services.branch_inventory_service import add_inventory

        other_branch = Branch.objects.create(name="Other Branch", code="OB")
        inv = add_inventory(self.branch, self.product, 30)
        resp = self.client.post(
            f"{self.base_url}/admin/inventory/transfer/",
            {
                "from_branch": str(self.branch.pk),
                "to_branch": str(other_branch.pk),
                "product": str(self.product.pk),
                "quantity": 12,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["source"]["quantity"], 18)
        self.assertEqual(resp.data["destination"]["quantity"], 12)

    # --- Cart Endpoints ---

    def test_cart_detail_authenticated(self):
        self._auth(self.student)
        resp = self.client.get(f"{self.base_url}/cart/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("items", resp.data)
        self.assertEqual(resp.data["item_count"], 0)

    def test_cart_detail_guest_with_session_key(self):
        resp = self.client.get(
            f"{self.base_url}/cart/",
            **{"HTTP_X_SESSION_KEY": "test-session"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("items", resp.data)

    def test_cart_detail_guest_without_session_key(self):
        resp = self.client.get(f"{self.base_url}/cart/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_add_item(self):
        self._auth(self.student)
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        resp = self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 2,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["quantity"], 2)

    def test_cart_add_item_insufficient_stock(self):
        self._auth(self.student)
        resp = self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 999,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_add_item_unauthenticated(self):
        resp = self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 1,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_update_item_quantity(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        add_resp = self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 2,
            },
            format="json",
        )
        item_id = add_resp.data["id"]
        resp = self.client.patch(
            f"{self.base_url}/cart/items/{item_id}/",
            {"quantity": 5},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["quantity"], 5)

    def test_cart_remove_item(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        add_resp = self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 2,
            },
            format="json",
        )
        item_id = add_resp.data["id"]
        resp = self.client.delete(
            f"{self.base_url}/cart/items/{item_id}/remove/",
        )
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_cart_clear(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        self.client.post(
            f"{self.base_url}/cart/items/",
            {
                "product": str(self.product.pk),
                "branch": str(self.branch.pk),
                "quantity": 2,
            },
            format="json",
        )
        resp = self.client.delete(f"{self.base_url}/cart/clear/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    # --- Checkout Endpoints ---

    def test_checkout_authenticated(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 2)

        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {"branch": str(self.branch.pk)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", resp.data)
        self.assertEqual(float(resp.data["subtotal"]), 199.98)
        self.assertEqual(float(resp.data["total"]), 199.98)
        self.assertIn("items", resp.data)

    def test_checkout_guest(self):
        from apps.store.services.branch_inventory_service import add_inventory

        add_inventory(self.branch, self.product, 10)
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        cart = get_or_create_cart(session_key="checkout-guest")
        add_to_cart(cart, self.product, self.branch, 1)

        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {
                "branch": str(self.branch.pk),
                "guest_name": "Guest User",
                "guest_email": "guest@test.com",
            },
            format="json",
            **{"HTTP_X_SESSION_KEY": "checkout-guest"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["guest_name"], "Guest User")
        self.assertEqual(resp.data["guest_email"], "guest@test.com")

    def test_checkout_without_session_or_auth(self):
        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {"branch": str(self.branch.pk)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_empty_cart(self):
        self._auth(self.student)
        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {"branch": str(self.branch.pk)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_guest_missing_name(self):
        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {
                "branch": str(self.branch.pk),
                "guest_email": "guest@test.com",
            },
            format="json",
            **{"HTTP_X_SESSION_KEY": "nosession"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_insufficient_stock(self):
        from apps.store.models import BranchInventory
        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 5)
        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 3)

        inv = BranchInventory.objects.get(branch=self.branch, product=self.product)
        inv.quantity = 1
        inv.save(update_fields=["quantity"])

        resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {"branch": str(self.branch.pk)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_order_detail(self):
        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 2)

        checkout_resp = self.client.post(
            f"{self.base_url}/cart/checkout/",
            {"branch": str(self.branch.pk)},
            format="json",
        )
        order_id = checkout_resp.data["id"]

        resp = self.client.get(
            f"{self.base_url}/pending-orders/{order_id}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["id"], order_id)

    # --- Payment Endpoints ---

    def test_payment_verify_valid(self):
        from unittest.mock import patch

        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.checkout_service import checkout
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 2)

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-test-ref-verify",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            order = checkout(cart, self.branch)

        payment = order.payment
        with patch(
            "apps.store.services.payment_service.shared_verify_payment"
        ) as mock_verify:
            mock_verify.return_value = {
                "status": "success",
                "reference": payment.transaction_reference,
                "provider": "chapa",
                "amount": 199.98,
                "currency": "ETB",
            }
            resp = self.client.post(
                f"{self.base_url}/payments/verify/",
                {"reference": payment.transaction_reference},
                format="json",
            )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["transaction_reference"], payment.transaction_reference)

    def test_payment_verify_invalid_reference(self):
        resp = self.client.post(
            f"{self.base_url}/payments/verify/",
            {"reference": "invalid-ref"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_verify_not_found(self):
        resp = self.client.post(
            f"{self.base_url}/payments/verify/",
            {"reference": "STORE-abc12345-def123456789"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_webhook_with_tx_ref(self):
        from unittest.mock import patch

        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.checkout_service import checkout
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 2)

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-test-ref-webhook",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            order = checkout(cart, self.branch)

        payment = order.payment
        with patch(
            "apps.store.services.payment_service.shared_verify_payment"
        ) as mock_verify:
            mock_verify.return_value = {
                "status": "success",
                "reference": payment.transaction_reference,
                "provider": "chapa",
                "amount": 199.98,
                "currency": "ETB",
            }
            resp = self.client.post(
                f"{self.base_url}/payments/webhook/",
                {"tx_ref": payment.transaction_reference},
                format="json",
            )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "success")

    def test_payment_webhook_missing_reference(self):
        resp = self.client.post(
            f"{self.base_url}/payments/webhook/",
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Admin Order Endpoints ---

    def _create_paid_pending_order(self):
        from unittest.mock import patch

        from apps.store.models.pending_order import PendingOrder
        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 10)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 2)

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-order-test-ref",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            from apps.store.services.checkout_service import checkout
            order = checkout(cart, self.branch)

        payment = order.payment
        with patch(
            "apps.store.services.payment_service.shared_verify_payment"
        ) as mock_verify:
            mock_verify.return_value = {
                "status": "success",
                "reference": payment.transaction_reference,
                "provider": "chapa",
                "amount": 199.98,
                "currency": "ETB",
            }
            from apps.store.services.payment_service import verify_store_payment
            verify_store_payment(payment.transaction_reference)
        return PendingOrder.objects.get(pk=order.pk)

    def test_admin_order_list(self):
        self._create_paid_pending_order()
        self._auth(self.super_admin)
        resp = self.client.get(f"{self.base_url}/admin/orders/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_admin_order_list_forbidden(self):
        self._create_paid_pending_order()
        resp = self.client.get(f"{self.base_url}/admin/orders/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_order_detail(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.super_admin)
        resp = self.client.get(f"{self.base_url}/admin/orders/{order.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["order_number"], order.order_number)

    def test_admin_order_status_change(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/orders/{order.pk}/status/",
            {"status": "PREPARING"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "PREPARING")

    def test_admin_order_status_invalid_transition(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.super_admin)
        resp = self.client.post(
            f"{self.base_url}/admin/orders/{order.pk}/status/",
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_order_status_forbidden(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        resp = self.client.post(
            f"{self.base_url}/admin/orders/{order.pk}/status/",
            {"status": "PREPARING"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- User Order Endpoints ---

    def test_user_order_list(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.student)
        resp = self.client.get(f"{self.base_url}/orders/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        order_ids = [o["id"] for o in resp.data]
        self.assertIn(str(order.pk), order_ids)

    def test_user_order_list_unauthenticated(self):
        resp = self.client.get(f"{self.base_url}/orders/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_order_detail(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.student)
        resp = self.client.get(f"{self.base_url}/orders/{order.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["order_number"], order.order_number)

    def test_user_order_detail_not_owner(self):
        pending = self._create_paid_pending_order()
        order = Order.objects.get(payment_reference=pending.payment_reference)
        self._auth(self.branch_manager)
        resp = self.client.get(f"{self.base_url}/orders/{order.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # --- Inventory Deduction (cross-cutting) ---

    def test_payment_verify_deducts_inventory(self):
        from unittest.mock import patch

        from apps.store.models import BranchInventory
        from apps.store.services.branch_inventory_service import add_inventory
        from apps.store.services.shopping_cart_service import add_to_cart, get_or_create_cart

        add_inventory(self.branch, self.product, 10)
        self._auth(self.student)
        cart = get_or_create_cart(user=self.student)
        add_to_cart(cart, self.product, self.branch, 3)

        with patch(
            "apps.store.services.payment_service.shared_initialize_payment"
        ) as mock_init:
            mock_init.return_value = {
                "provider": "chapa",
                "reference": "STORE-deduct-ref",
                "status": "success",
                "checkout_url": "https://checkout.test/",
            }
            resp = self.client.post(
                f"{self.base_url}/cart/checkout/",
                {"branch": str(self.branch.pk)},
                format="json",
            )
            pending_id = resp.data["id"]

        from apps.store.models.pending_order import PendingOrder
        pending = PendingOrder.objects.get(pk=pending_id)
        payment = pending.payment

        with patch(
            "apps.store.services.payment_service.shared_verify_payment"
        ) as mock_verify:
            mock_verify.return_value = {
                "status": "success",
                "reference": payment.transaction_reference,
                "provider": "chapa",
                "amount": 299.97,
                "currency": "ETB",
            }
            self.client.post(
                f"{self.base_url}/payments/verify/",
                {"reference": payment.transaction_reference},
                format="json",
            )

        inv = BranchInventory.objects.get(branch=self.branch, product=self.product)
        self.assertEqual(inv.quantity, 7)
