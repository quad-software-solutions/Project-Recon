"""
Service-layer tests for the accounts module.
"""

from django.test import TestCase, override_settings
from django.utils import timezone
from django.core import mail
from django.conf import settings
from datetime import timedelta

from apps.accounts.models import User, Branch, UserAssignment, TrustedDevice, OTPChallenge
from apps.accounts.constants import Roles, AccountStatus, OTPPurpose, BranchStatus
from apps.accounts.services import (
    authentication_service,
    user_service,
    branch_service,
    assignment_service,
    otp_service,
    device_service,
)
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
    ValidationError,
    Throttled,
)
from apps.accounts.services.jwt_tokens_services import refresh_access_token


class ServicesTestCase(TestCase):
    """Core accounts service workflows."""

    def setUp(self):
        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", "StrongP@ssw0rd!2026"
        )
        self.branch = Branch.objects.create(name="Test Branch", code="TB01")
        self.user = user_service.create_student_user(
            "student@test.com", "Student", "Test", "StrongP@ssw0rd!2026", self.branch
        )
        user_service.activate_user(self.user)
        self.user.is_email_verified = True
        self.user.save()

    def test_login_success(self):
        tokens = authentication_service.login("student@test.com", "StrongP@ssw0rd!2026")
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)

    def test_login_requires_branch_for_non_super_admin(self):
        lone = User.objects.create_user(
            email="lone@test.com",
            first_name="Lone",
            last_name="User",
            password="StrongP@ssw0rd!2026",
            status=AccountStatus.ACTIVE,
            is_email_verified=True,
        )
        with self.assertRaises(PermissionDenied):
            authentication_service.login("lone@test.com", "StrongP@ssw0rd!2026")


    @override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=True)
    def test_login_device_verification_required(self):
        with self.assertRaises(PermissionDenied):
            authentication_service.login(
                "student@test.com",
                "StrongP@ssw0rd!2026",
                device_info={"fingerprint": "new-device", "ip_address": "127.0.0.1"},
            )

    def test_refresh_token_rotation(self):
        tokens = authentication_service.login("student@test.com", "StrongP@ssw0rd!2026")
        new_tokens = refresh_access_token(tokens["refresh"])
        self.assertIn("access", new_tokens)
        self.assertIn("refresh", new_tokens)

    def test_otp_generate_and_verify(self):
        challenge, raw_code = otp_service.generate(self.user, OTPPurpose.PASSWORD_RESET)
        self.assertTrue(otp_service.verify(self.user, OTPPurpose.PASSWORD_RESET, raw_code))
        challenge.refresh_from_db()
        self.assertTrue(challenge.is_used)

    def test_otp_max_attempts(self):
        challenge, raw_code = otp_service.generate(self.user, OTPPurpose.PASSWORD_RESET)
        for _ in range(3):
            with self.assertRaises(ValidationError):
                otp_service.verify(self.user, OTPPurpose.PASSWORD_RESET, "wrong")

        with self.assertRaises(Throttled):
            otp_service.verify(self.user, OTPPurpose.PASSWORD_RESET, raw_code)

    def test_assign_role_duplicate_and_reactivation(self):
        assignment = self.user.assignments.first()
        assignment_service.remove_assignment(assignment)

        new_assignment = assignment_service.assign_role(self.user, Roles.STUDENT, self.branch)
        self.assertEqual(new_assignment.id, assignment.id)
        self.assertTrue(new_assignment.is_active)

        with self.assertRaises(ValidationError):
            assignment_service.assign_role(self.user, Roles.STUDENT, self.branch)

    def test_assign_role_rejects_archived_branch(self):
        active_branch = Branch.objects.create(name="Active Branch", code="AB01")
        extra = user_service.create_student_user(
            "extra@test.com", "Extra", "User", "StrongP@ssw0rd!2026", active_branch
        )
        self.branch.status = BranchStatus.ARCHIVED
        self.branch.save()
        with self.assertRaises(ValidationError):
            assignment_service.assign_role(extra, Roles.INSTRUCTOR, self.branch)

    def test_primary_assignment_replaces_existing(self):
        branch2 = Branch.objects.create(name="Branch Two", code="TB02")
        assignment_service.assign_role(
            self.user, Roles.INSTRUCTOR, branch2, is_primary=True
        )
        primaries = UserAssignment.objects.filter(user=self.user, is_primary=True)
        self.assertEqual(primaries.count(), 1)
        self.assertEqual(primaries.first().branch, branch2)

    def test_change_branch_manager_3_step_flow(self):
        manager1 = user_service.create_branch_manager(
            "mgr1@test.com", "M", "1", "StrongP@ssw0rd!2026", self.branch
        )
        branch2 = Branch.objects.create(name="Test Branch 2", code="TB02")
        manager2 = user_service.create_branch_manager(
            "mgr2@test.com", "M", "2", "StrongP@ssw0rd!2026", branch2
        )

        new_assignment = branch_service.change_branch_manager(self.branch, manager2)
        self.assertEqual(new_assignment.user, manager2)

        old_assignment = manager1.assignments.get(role=Roles.BRANCH_MANAGER, branch=self.branch)
        self.assertFalse(old_assignment.is_active)

    def test_password_reset_scan_and_match(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.PASSWORD_RESET)
        authentication_service.reset_password(self.user.email, raw_code, "NewP@ssw0rd!2026")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewP@ssw0rd!2026"))

    def test_branch_crud_service_methods(self):
        branch = branch_service.create_branch(
            {"name": "New Branch", "code": "NB01"}, actor=self.super_admin
        )
        branch_service.update_branch(branch, actor=self.super_admin, city="Addis Ababa")
        branch.refresh_from_db()
        self.assertEqual(branch.city, "Addis Ababa")

        branches = branch_service.list_branches(active_only=True)
        self.assertTrue(branches.filter(id=branch.id).exists())
        self.assertEqual(branch_service.get_branch(branch.id), branch)

        branch_service.deactivate_branch(branch)
        self.assertEqual(branch_service.get_branch(branch.id).status, BranchStatus.INACTIVE)
        branch_service.archive_branch(branch)
        self.assertEqual(branch_service.get_branch(branch.id).status, BranchStatus.ARCHIVED)

    def test_update_user_and_list_assignments(self):
        user_service.update_user(self.user, actor=self.super_admin, first_name="Updated")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")

        assignments = assignment_service.list_assignments(user=self.user)
        self.assertGreaterEqual(assignments.count(), 1)

    def test_device_trust_null_expiry(self):
        TrustedDevice.objects.create(
            user=self.user,
            device_id="dev-1",
            fingerprint="fp-null-expiry",
            last_used_at=timezone.now(),
            expires_at=None,
            is_active=True,
        )
        self.assertTrue(device_service.is_device_trusted(self.user, "fp-null-expiry"))

    def test_update_assignment_primary_must_be_active(self):
        assignment = self.user.assignments.first()
        with self.assertRaises(ValidationError):
            assignment_service.update_assignment(
                assignment, is_primary=True, is_active=False
            )


class EmailVerificationServiceTests(TestCase):
    """Service-level email verification and OTP flow tests."""

    def setUp(self):
        self.branch = Branch.objects.create(name="OTP Branch", code="OTP01")
        self.user = user_service.create_student_user(
            "otpuser@test.com", "Otp", "User", "StrongP@ssw0rd!2026", self.branch
        )

    # ── OTP generate ─────────────────────────────────────

    def test_otp_generate_creates_hashed_code(self):
        challenge, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        self.assertNotEqual(challenge.otp_code, raw_code)
        self.assertTrue(challenge.otp_code.startswith("pbkdf2_"))
        self.assertEqual(challenge.purpose, OTPPurpose.EMAIL_VERIFICATION)
        self.assertFalse(challenge.is_used)

    def test_otp_generate_sets_expiry(self):
        challenge, _ = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        self.assertIsNotNone(challenge.expires_at)
        self.assertGreater(challenge.expires_at, timezone.now())

    def test_otp_generate_invalidates_previous(self):
        first, _ = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        second, _ = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        first.refresh_from_db()
        self.assertTrue(first.is_used)
        self.assertFalse(second.is_used)

    # ── OTP verify ────────────────────────────────────────

    def test_otp_verify_correct_code(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        result = otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, raw_code)
        self.assertTrue(result)

    def test_otp_verify_wrong_code_raises_error(self):
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        with self.assertRaises(ValidationError):
            otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, "000000")

    def test_otp_verify_no_active_challenge_raises_not_found(self):
        with self.assertRaises(NotFound):
            otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, "000000")

    # ── OTP expired ───────────────────────────────────────

    @override_settings(AUTH_OTP_EXPIRY_MINUTES=-1)
    def test_otp_verify_expired_raises_error(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        with self.assertRaises(ValidationError):
            otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, raw_code)

    # ── OTP max attempts ──────────────────────────────────

    def test_otp_exhausts_attempts_then_throttled(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        for _ in range(3):
            with self.assertRaises(ValidationError):
                otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, "wrong")
        with self.assertRaises(Throttled):
            otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, raw_code)

    def test_otp_success_resets_attempts_for_next_purpose(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.verify(self.user, OTPPurpose.EMAIL_VERIFICATION, raw_code)
        challenge, raw_code2 = otp_service.generate(self.user, OTPPurpose.PASSWORD_RESET)
        self.assertTrue(otp_service.verify(self.user, OTPPurpose.PASSWORD_RESET, raw_code2))

    # ── OTP resend limit ──────────────────────────────────

    def test_otp_resend_exceeds_limit(self):
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        with self.assertRaises(Throttled):
            otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)

    # ── OTP send (email delivery) ─────────────────────────

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        DEFAULT_FROM_EMAIL="noreply@test.com",
    )
    def test_otp_send_delivers_email(self):
        otp_service.send(self.user, OTPPurpose.EMAIL_VERIFICATION)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)
        self.assertIn("EMAIL_VERIFICATION", mail.outbox[0].subject)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_otp_send_contains_code_in_body(self):
        otp_service.send(self.user, OTPPurpose.PASSWORD_RESET)
        challenge = OTPChallenge.objects.filter(
            user=self.user, purpose=OTPPurpose.PASSWORD_RESET, is_used=False
        ).first()
        self.assertIsNotNone(challenge)
        body = mail.outbox[0].body
        self.assertIn("one-time password", body.lower())
        self.assertIn(str(settings.AUTH_OTP_EXPIRY_MINUTES), body)

    # ── OTP invalidate ────────────────────────────────────

    def test_otp_invalidate_marks_all_active_as_used(self):
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        otp_service.invalidate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        active = OTPChallenge.objects.filter(
            user=self.user, purpose=OTPPurpose.EMAIL_VERIFICATION, is_used=False
        )
        self.assertEqual(active.count(), 0)

    # ── OTP cleanup_expired ───────────────────────────────

    @override_settings(AUTH_OTP_EXPIRY_MINUTES=-10)
    def test_otp_cleanup_expired(self):
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        count = otp_service.cleanup_expired()
        self.assertGreaterEqual(count, 1)

    # ── Email verification full flow ──────────────────────

    @override_settings(
        AUTH_REQUIRE_EMAIL_VERIFICATION=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_request_email_verification_sends_otp(self):
        authentication_service.request_email_verification(self.user)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_verify_email_otp_activates_account(self):
        self.user.status = AccountStatus.PENDING
        self.user.is_email_verified = False
        self.user.save()
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        authentication_service.verify_email_otp(self.user, raw_code)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)
        self.assertEqual(self.user.status, AccountStatus.ACTIVE)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_verify_email_otp_registers_first_device(self):
        self.user.is_email_verified = False
        self.user.save()
        _, raw_code = otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        device_info = {"fingerprint": "fp-test", "device_id": "d1", "device_name": "Test Phone", "device_type": "Mobile"}
        authentication_service.verify_email_otp(self.user, raw_code, device_info=device_info)
        self.assertTrue(
            device_service.is_device_trusted(self.user, "fp-test")
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_verify_email_otp_wrong_code_raises_error(self):
        otp_service.generate(self.user, OTPPurpose.EMAIL_VERIFICATION)
        with self.assertRaises(ValidationError):
            authentication_service.verify_email_otp(self.user, "wrong-code")

    # ── Forgot + reset password full flow ─────────────────

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_forgot_password_sends_otp_for_existing_user(self):
        authentication_service.forgot_password(self.user.email)
        self.assertEqual(len(mail.outbox), 1)

    def test_forgot_password_silent_for_nonexistent_user(self):
        authentication_service.forgot_password("nobody@test.com")
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_reset_password_full_flow(self):
        _, raw_code = otp_service.generate(self.user, OTPPurpose.PASSWORD_RESET)
        authentication_service.reset_password(self.user.email, raw_code, "NewP@ssw0rd!2026")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewP@ssw0rd!2026"))

    def test_reset_password_invalid_otp_raises_error(self):
        with self.assertRaises(ValidationError):
            authentication_service.reset_password(self.user.email, "000000", "NewP@ssw0rd!2026")
