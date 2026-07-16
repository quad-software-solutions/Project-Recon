from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.constants import Roles
from apps.accounts.models import Branch, User, UserAssignment
from apps.shared.bank.models import BankAccount


class BankAccountAPIPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = "/api/v1/bank-accounts/"

        self.branch = Branch.objects.create(name="Test Branch", code="TST")

        self.super_admin = User.objects.create_user(
            email="super@test.com", password="testpass123",
            first_name="Super", last_name="Admin", status="Active",
        )
        UserAssignment.objects.create(
            user=self.super_admin, role=Roles.SUPER_ADMIN, branch=None, is_active=True,
        )

        self.branch_manager = User.objects.create_user(
            email="manager@test.com", password="testpass123",
            first_name="Branch", last_name="Manager", status="Active",
        )
        UserAssignment.objects.create(
            user=self.branch_manager, role=Roles.BRANCH_MANAGER, branch=self.branch, is_active=True,
        )

        self.student = User.objects.create_user(
            email="student@test.com", password="testpass123",
            first_name="Student", last_name="User", status="Active",
        )
        UserAssignment.objects.create(
            user=self.student, role=Roles.STUDENT, branch=self.branch, is_active=True,
        )

    def test_unauthenticated_can_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_can_list(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_create(self):
        response = self.client.post(
            self.list_url,
            {"bank_name": "Test", "account_holder": "H", "account_number": "123"},
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_student_cannot_create(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            self.list_url,
            {"bank_name": "Test", "account_holder": "H", "account_number": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_super_admin_can_create(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(
            self.list_url,
            {"bank_name": "Test Bank", "account_holder": "John Doe", "account_number": "100200300"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_branch_manager_cannot_create(self):
        self.client.force_authenticate(user=self.branch_manager)
        response = self.client.post(
            self.list_url,
            {"bank_name": "Test Bank", "account_holder": "Jane Doe", "account_number": "400500600"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BankAccountAPICrudTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = "/api/v1/bank-accounts/"

        self.branch = Branch.objects.create(name="Crud Branch", code="CRD")

        self.admin = User.objects.create_user(
            email="admin@test.com", password="testpass123",
            first_name="Admin", last_name="User", status="Active",
        )
        UserAssignment.objects.create(
            user=self.admin, role=Roles.SUPER_ADMIN, branch=None, is_active=True,
        )
        self.client.force_authenticate(user=self.admin)

        self.account = BankAccount.objects.create(
            bank_name="Bank A",
            account_holder="Holder A",
            account_number="ACC001",
            branch="Main",
            swift_code="SWIFT001",
        )

    def test_list_bank_accounts(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_detail_bank_account(self):
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bank_name"], "Bank A")
        self.assertEqual(response.data["account_number"], "ACC001")

    def test_create_bank_account(self):
        response = self.client.post(
            self.list_url,
            {
                "bank_name": "Bank B",
                "account_holder": "Holder B",
                "account_number": "ACC002",
                "swift_code": "SWIFT002",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["bank_name"], "Bank B")

    def test_update_bank_account(self):
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.put(
            url,
            {
                "bank_name": "Bank A Updated",
                "account_holder": "Holder A",
                "account_number": "ACC001",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bank_name"], "Bank A Updated")

    def test_partial_update_bank_account(self):
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.patch(url, {"branch": "New Branch"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["branch"], "New Branch")

    def test_delete_bank_account(self):
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BankAccount.objects.filter(id=self.account.id).exists())

    def test_student_can_detail(self):
        student = User.objects.create_user(
            email="stud@test.com", password="testpass123",
            first_name="S", last_name="T", status="Active",
        )
        UserAssignment.objects.create(
            user=student, role=Roles.STUDENT, branch=self.branch, is_active=True,
        )
        self.client.force_authenticate(user=student)
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_cannot_update(self):
        student = User.objects.create_user(
            email="stud2@test.com", password="testpass123",
            first_name="S2", last_name="T2", status="Active",
        )
        UserAssignment.objects.create(
            user=student, role=Roles.STUDENT, branch=self.branch, is_active=True,
        )
        self.client.force_authenticate(user=student)
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.put(
            url,
            {"bank_name": "Hacked", "account_holder": "X", "account_number": "999"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_delete(self):
        student = User.objects.create_user(
            email="stud3@test.com", password="testpass123",
            first_name="S3", last_name="T3", status="Active",
        )
        UserAssignment.objects.create(
            user=student, role=Roles.STUDENT, branch=self.branch, is_active=True,
        )
        self.client.force_authenticate(user=student)
        url = f"{self.list_url}{self.account.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
