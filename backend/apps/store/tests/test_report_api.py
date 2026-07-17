import csv
import io

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.store.models import Product, ProductCategory
from apps.store.models.branch_inventory import BranchInventory
from apps.store.services.branch_inventory_service import add_inventory
from apps.store.services.category_service import create_category
from apps.store.services.product_service import create_product


@override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=False)
class ReportApiTestCase(APITestCase):
    base_url = "/api/v1/store"

    def setUp(self):
        self._old_throttle_rates = SimpleRateThrottle.THROTTLE_RATES
        SimpleRateThrottle.THROTTLE_RATES = {
            **SimpleRateThrottle.THROTTLE_RATES,
            "anon_login": "1000/min",
        }
        self.password = "StrongP@ssw0rd!2026"
        self.branch = Branch.objects.create(name="Test Branch", code="T01")
        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        self.regular_user = user_service.create_student_user(
            "user@test.com", "Regular", "User", self.password, self.branch
        )
        user_service.activate_user(self.regular_user)
        self.category = create_category({"name": "Test Category"})
        self.product = create_product({
            "category": self.category.pk,
            "name": "Test Product",
            "slug": "test-product",
            "sku": "TST-001",
            "price": 25.00,
        })

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

    def _report_url(self, name):
        return f"{self.base_url}/admin/reports/{name}/"

    def _assert_csv_response(self, response, expected_filename_prefix):
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn(expected_filename_prefix, response["Content-Disposition"])

    def _parse_csv(self, response):
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        return list(reader)

    # --- Auth ---

    def test_reports_require_auth(self):
        for name in ["products", "inventory", "low-stock", "sales", "orders", "branch-sales"]:
            resp = self.client.get(self._report_url(name))
            self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED, msg=name)

    def test_reports_require_staff(self):
        self._auth(self.regular_user)
        for name in ["products", "inventory", "low-stock", "sales", "orders", "branch-sales"]:
            resp = self.client.get(self._report_url(name))
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, msg=name)

    # --- Product Statistics ---

    def test_product_statistics_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("products"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("summary", resp.data)
        self.assertIn("by_category", resp.data)

    def test_product_statistics_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("products"), {"export": "csv"})
        self._assert_csv_response(resp, "products-report")

    # --- Inventory Report ---

    def test_inventory_report_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("inventory"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_inventory_report_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("inventory"), {"export": "csv"})
        self._assert_csv_response(resp, "inventory-report")

    # --- Low Stock Report ---

    def test_low_stock_report_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("low-stock"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_low_stock_report_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("low-stock"), {"export": "csv"})
        self._assert_csv_response(resp, "low-stock-report")

    # --- Sales Report ---

    def test_sales_report_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("sales"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_sales_report_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("sales"), {"export": "csv"})
        self._assert_csv_response(resp, "sales-report")

    def test_sales_report_with_params(self):
        self._auth(self.super_admin)
        resp = self.client.get(
            self._report_url("sales"),
            {"group_by": "month", "branch_id": "00000000-0000-0000-0000-000000000000"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # --- Order Report ---

    def test_order_report_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("orders"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_order_report_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("orders"), {"export": "csv"})
        self._assert_csv_response(resp, "orders-report")

    def test_order_report_with_params(self):
        self._auth(self.super_admin)
        resp = self.client.get(
            self._report_url("orders"),
            {"status": "PAID", "group_by": "week"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # --- Branch Sales Report ---

    def test_branch_sales_report_json(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("branch-sales"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_branch_sales_report_csv(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("branch-sales"), {"export": "csv"})
        self._assert_csv_response(resp, "branch-sales-report")

    # --- CSV Content ---

    def test_inventory_csv_has_headers(self):
        self._auth(self.super_admin)
        add_inventory(self.branch, self.product, 5)
        resp = self.client.get(self._report_url("inventory"), {"export": "csv"})
        rows = self._parse_csv(resp)
        self.assertGreater(len(rows), 0)
        self.assertIn("product_name", rows[0])

    def test_sales_csv_has_headers(self):
        self._auth(self.super_admin)
        resp = self.client.get(self._report_url("sales"), {"export": "csv"})
        rows = self._parse_csv(resp)
        if rows:
            self.assertIn("period", rows[0])
