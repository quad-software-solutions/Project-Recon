import uuid

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.store.models import Product, ProductCategory, ProductImage
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
