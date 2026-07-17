"""User API endpoint tests."""
from rest_framework import status

from apps.accounts.tests.api.base import AccountsAPITestCase


class UserAPITestCase(AccountsAPITestCase):
    """User list, detail, create, update, and lifecycle tests."""

    # ── List ──────────────────────────────────────────────

    def test_list_users_requires_authentication(self):
        response = self.client.get(f"{self.base_url}/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_users_as_super_admin(self):
        self.authenticate_as()
        response = self.client.get(f"{self.base_url}/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u["email"] for u in response.json()["results"]]
        self.assertIn(self.student.email, emails)
        self.assertIn(self.super_admin.email, emails)

    def test_list_users_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_search_by_email(self):
        self.authenticate_as()
        response = self.client.get(
            f"{self.base_url}/users/", {"search": "student@test.com"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u["email"] for u in response.json()["results"]]
        self.assertIn("student@test.com", emails)
        self.assertNotIn("admin@test.com", emails)

    # ── Detail ────────────────────────────────────────────

    def test_get_user_detail_includes_assignments(self):
        self.authenticate_as()
        response = self.client.get(f"{self.base_url}/users/{self.student.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("assignments", data)
        self.assertGreaterEqual(len(data["assignments"]), 1)
        self.assertNotIn("password", data)

    def test_get_user_detail_as_self(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/users/{self.student.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_detail_as_student_for_other_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/users/{self.super_admin.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_user_detail_non_existent_returns_404(self):
        self.authenticate_as()
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = self.client.get(f"{self.base_url}/users/{fake_id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Update ────────────────────────────────────────────

    def test_update_own_profile_as_student(self):
        self.authenticate_as(self.student)
        response = self.client.patch(
            f"{self.base_url}/users/{self.student.id}/",
            {"first_name": "UpdatedName"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, "UpdatedName")

    def test_update_other_user_as_super_admin_returns_403(self):
        self.authenticate_as()
        response = self.client.patch(
            f"{self.base_url}/users/{self.student.id}/",
            {"first_name": "UpdatedBySA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_other_user_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.patch(
            f"{self.base_url}/users/{self.super_admin.id}/",
            {"first_name": "Hacker"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_unauthenticated_returns_401(self):
        response = self.client.patch(
            f"{self.base_url}/users/{self.student.id}/",
            {"first_name": "NoAuth"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_own_email(self):
        self.authenticate_as(self.student)
        response = self.client.patch(
            f"{self.base_url}/users/{self.student.id}/",
            {"email": "newemail@test.com", "current_password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── Create Staff ──────────────────────────────────────

    def test_create_staff_user_as_super_admin(self):
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/users/staff/",
            {
                "email": "instructor@test.com",
                "first_name": "Inst",
                "last_name": "One",
                "password": self.password,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["email"], "instructor@test.com")

    def test_create_staff_user_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.post(
            f"{self.base_url}/users/staff/",
            {
                "email": "instructor@test.com",
                "first_name": "Inst",
                "last_name": "One",
                "password": self.password,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_staff_user_nonexistent_branch_returns_404(self):
        self.authenticate_as()
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = self.client.post(
            f"{self.base_url}/users/staff/",
            {
                "email": "instructor@test.com",
                "first_name": "Inst",
                "last_name": "One",
                "password": self.password,
                "branch_id": fake_id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_staff_user_unauthenticated_returns_401(self):
        response = self.client.post(
            f"{self.base_url}/users/staff/",
            {
                "email": "instructor@test.com",
                "first_name": "Inst",
                "last_name": "One",
                "password": self.password,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Create Branch Manager ─────────────────────────────

    def test_create_branch_manager_as_super_admin(self):
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/users/branch-managers/",
            {
                "email": "mgr@test.com",
                "first_name": "Mgr",
                "last_name": "One",
                "password": self.password,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["email"], "mgr@test.com")

    def test_create_branch_manager_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.post(
            f"{self.base_url}/users/branch-managers/",
            {
                "email": "mgr@test.com",
                "first_name": "Mgr",
                "last_name": "One",
                "password": self.password,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_branch_manager_nonexistent_branch_returns_404(self):
        self.authenticate_as()
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = self.client.post(
            f"{self.base_url}/users/branch-managers/",
            {
                "email": "mgr@test.com",
                "first_name": "Mgr",
                "last_name": "One",
                "password": self.password,
                "branch_id": fake_id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Activate / Deactivate / Archive ───────────────────

    def test_activate_user_as_super_admin(self):
        self.student.status = "Suspended"
        self.student.save()
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/users/{self.student.id}/activate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "Active")

    def test_activate_user_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.post(
            f"{self.base_url}/users/{self.super_admin.id}/activate/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deactivate_user_as_super_admin(self):
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/users/{self.student.id}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "Suspended")

    def test_deactivate_user_nonexistent_returns_404(self):
        self.authenticate_as()
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = self.client.post(
            f"{self.base_url}/users/{fake_id}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_archive_user_as_super_admin(self):
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/users/{self.student.id}/archive/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "Archived")

    def test_archive_user_as_student_returns_403(self):
        self.authenticate_as(self.student)
        response = self.client.post(
            f"{self.base_url}/users/{self.super_admin.id}/archive/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
