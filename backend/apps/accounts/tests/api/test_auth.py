"""Authentication API endpoint tests."""
import re
from django.test import override_settings
from django.core import mail
from rest_framework import status

from apps.accounts.models import User
from apps.accounts.constants import AccountStatus
from apps.accounts.services import user_service, otp_service
from apps.accounts.tests.api.base import AccountsAPITestCase


class AuthAPITestCase(AccountsAPITestCase):
    """Login, logout, token refresh, email/device verification, password management."""

    def test_login_success_returns_tokens(self):
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("access", body)
        self.assertIn("refresh", body)
        self.assertNotIn("password", body)

    def test_login_invalid_credentials_returns_401(self):
        response = self._login(password="wrong-password")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_suspended_account_returns_403(self):
        self.student.status = "Suspended"
        self.student.save()
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_archived_account_returns_403(self):
        self.student.status = "Archived"
        self.student.save()
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_non_existent_email_returns_401(self):
        response = self._login(email="nobody@test.com")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=True)
    def test_login_requires_device_verification_when_enabled(self):
        response = self._login(
            extra={"fingerprint": "unknown-device", "device_id": "d1"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_blacklists_refresh_token(self):
        self.authenticate_as(self.student)
        login_resp = self._login()
        refresh = login_resp.json()["refresh"]
        response = self.client.post(
            f"{self.base_url}/logout/",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_logout_unauthenticated_returns_401(self):
        response = self.client.post(
            f"{self.base_url}/logout/",
            {"refresh": "some-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_returns_new_tokens(self):
        login_resp = self._login()
        refresh = login_resp.json()["refresh"]
        response = self.client.post(
            f"{self.base_url}/token/refresh/",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("access", body)
        self.assertIn("refresh", body)

    def test_token_refresh_invalid_returns_401(self):
        response = self.client.post(
            f"{self.base_url}/token/refresh/",
            {"refresh": "invalid-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_email_verification_request_requires_auth(self):
        response = self.client.post(f"{self.base_url}/email-verification/request/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_email_verification_request_returns_204(self):
        self.authenticate_as()
        response = self.client.post(f"{self.base_url}/email-verification/request/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_email_verification_verify_requires_auth(self):
        response = self.client.post(
            f"{self.base_url}/email-verification/verify/",
            {"otp": "000000"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_email_verification_verify_invalid_otp_returns_404(self):
        self.authenticate_as()
        response = self.client.post(
            f"{self.base_url}/email-verification/verify/",
            {"otp": "000000"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_forgot_password_always_returns_200(self):
        response = self.client.post(
            f"{self.base_url}/password/forgot/",
            {"email": "nobody@test.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_forgot_password_with_valid_email_returns_200(self):
        response = self.client.post(
            f"{self.base_url}/password/forgot/",
            {"email": self.student.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_password_invalid_otp_returns_400(self):
        response = self.client.post(
            f"{self.base_url}/password/reset/",
            {"otp": "wrong", "new_password": "NewP@ssw0rd!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_requires_authentication(self):
        response = self.client.patch(
            f"{self.base_url}/password/change/",
            {"old_password": self.password, "new_password": "NewP@ssw0rd!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_success(self):
        self.authenticate_as(self.student)
        response = self.client.patch(
            f"{self.base_url}/password/change/",
            {"old_password": self.password, "new_password": "NewP@ssw0rd!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old_returns_401(self):
        self.authenticate_as(self.student)
        response = self.client.patch(
            f"{self.base_url}/password/change/",
            {"old_password": "wrong-old", "new_password": "NewP@ssw0rd!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_device_verification_request_requires_auth(self):
        response = self.client.post(f"{self.base_url}/device-verification/request/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_device_verification_verify_requires_auth(self):
        response = self.client.post(
            f"{self.base_url}/device-verification/verify/",
            {"otp": "000000", "fingerprint": "fp", "device_id": "d1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EmailVerificationAPIFlowTests(AccountsAPITestCase):
    """End-to-end email verification flow via the API."""

    def setUp(self):
        super().setUp()
        self.unverified_user = user_service.create_student_user(
            "unverified@test.com", "Un", "Verified", self.password, self.branch
        )
        self.unverified_user.status = AccountStatus.ACTIVE
        self.unverified_user.save()

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        DEFAULT_FROM_EMAIL="noreply@test.com",
    )
    def test_full_email_verification_flow(self):
        """Request OTP via API → extract from email → verify via API."""
        self.authenticate_as(self.unverified_user)

        request_resp = self.client.post(
            f"{self.base_url}/email-verification/request/"
        )
        self.assertEqual(request_resp.status_code, status.HTTP_204_NO_CONTENT)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.unverified_user.email, mail.outbox[0].to)

        match = re.search(r"is:\s*(\d{6})", mail.outbox[0].body)
        self.assertIsNotNone(match, "OTP code not found in email body")
        otp_code = match.group(1)

        verify_resp = self.client.post(
            f"{self.base_url}/email-verification/verify/",
            {"otp": otp_code},
            format="json",
        )
        self.assertEqual(verify_resp.status_code, status.HTTP_204_NO_CONTENT)

        self.unverified_user.refresh_from_db()
        self.assertTrue(self.unverified_user.is_email_verified)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_email_verification_request_sends_email(self):
        self.authenticate_as(self.unverified_user)
        self.client.post(f"{self.base_url}/email-verification/request/")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("EMAIL_VERIFICATION", mail.outbox[0].subject)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_email_verification_request_resend_increments_count(self):
        self.authenticate_as(self.unverified_user)
        self.client.post(f"{self.base_url}/email-verification/request/")
        self.client.post(f"{self.base_url}/email-verification/request/")
        self.assertEqual(len(mail.outbox), 2)

    def test_email_verification_verify_wrong_otp_returns_404(self):
        self.authenticate_as(self.unverified_user)
        response = self.client.post(
            f"{self.base_url}/email-verification/verify/",
            {"otp": "000000"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_email_verification_verify_short_otp_returns_400(self):
        self.authenticate_as(self.unverified_user)
        response = self.client.post(
            f"{self.base_url}/email-verification/verify/",
            {"otp": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
