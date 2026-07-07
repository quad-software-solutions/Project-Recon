"""
Authentication lifecycle service.

Handles login, logout, token refresh, email/device verification,
and password management workflows.
"""

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework_simplejwt.exceptions import TokenError
from apps.accounts.models import User, OTPChallenge
from apps.accounts.constants import AccountStatus, OTPPurpose, Roles
from apps.accounts.services import otp_service, device_service
from apps.shared.audit.services import log_action
from apps.accounts.services.jwt_tokens_services import (
    issue_tokens_for_user,
    blacklist_refresh_token,
    refresh_access_token,
)


def _extract_device_context(device_info: dict | None) -> dict:
    """
    Pull normalized device metadata from a device_info payload.

    Args:
        device_info: Optional dict with fingerprint, ip_address, and user_agent.

    Returns:
        Dict with fingerprint, ip_address, and user_agent keys (values may be None).
    """
    if not device_info:
        return {"fingerprint": None, "ip_address": None, "user_agent": None}
    return {
        "fingerprint": device_info.get("fingerprint"),
        "ip_address": device_info.get("ip_address"),
        "user_agent": device_info.get("user_agent"),
    }


def _user_has_active_branch_assignment(user) -> bool:
    """
    Return True when the user has at least one active non–Super Admin branch assignment.

    Args:
        user: User instance to inspect.

    Returns:
        True if an active branch assignment exists; False otherwise.
    """
    return user.assignments.filter(
        is_active=True,
        branch__isnull=False,
    ).exists()


def _user_is_super_admin(user) -> bool:
    """
    Return True when the user holds an active Super Admin assignment.

    Args:
        user: User instance to inspect.

    Returns:
        True if the user is an active Super Admin.
    """
    return user.assignments.filter(
        is_active=True,
        role=Roles.SUPER_ADMIN,
        branch__isnull=True,
    ).exists()


def login(email: str, password: str, device_info: dict | None = None) -> dict:
    """
    Authenticate a user and issue JWT tokens.

    Args:
        email: Login email address.
        password: Plain-text password.
        device_info: Optional device metadata (fingerprint, ip_address, user_agent).

    Returns:
        Dict with ``access`` and ``refresh`` JWT strings, or a dict with
        ``requires_verification`` when the account needs email verification.

    Raises:
        PermissionDenied: Account locked, suspended, archived, no branch.
        AuthenticationFailed: Unknown email or wrong password.
    """
    ctx = _extract_device_context(device_info)

    user = User.objects.filter(email__iexact=email).prefetch_related("assignments").first()
    if not user:
        raise AuthenticationFailed("Invalid credentials.")

    if user.status == AccountStatus.SUSPENDED:
        raise PermissionDenied("Account is suspended.")

    if user.status == AccountStatus.ARCHIVED:
        raise PermissionDenied("Account is archived.")

    if not user.check_password(password):
        raise AuthenticationFailed("Invalid credentials.")

    if (
        user.status == AccountStatus.PENDING
        and settings.AUTH_REQUIRE_EMAIL_VERIFICATION
        and not user.is_email_verified
    ):
        return {
            "requires_verification": "email",
            "email": user.email,
        }

    if not _user_is_super_admin(user) and not _user_has_active_branch_assignment(user):
        raise PermissionDenied("At least one active branch assignment is required.")

    if settings.AUTH_REQUIRE_DEVICE_VERIFICATION and ctx["fingerprint"]:
        if not device_service.is_device_trusted(user, ctx["fingerprint"]):
            raise PermissionDenied("Device verification required.")

    log_action(user, "LOGIN", "User", user.id)
    return issue_tokens(user)


def issue_tokens(user) -> dict:
    """
    Issue JWT access and refresh tokens for a user.

    Args:
        user: Authenticated User instance.

    Returns:
        Dict with ``access`` and ``refresh`` string tokens.
    """
    return issue_tokens_for_user(user)


def logout(user, refresh_token_str: str) -> None:
    """
    Blacklist a refresh token and record logout audit.

    Args:
        user: Authenticated User instance.
        refresh_token_str: Refresh token to invalidate.

    Returns:
        None.
    """
    blacklist_refresh_token(refresh_token_str)
    log_action(user, "LOG", "User", user.id)


def refresh_token(refresh_token_str: str) -> dict:
    """
    Rotate a refresh token and return a new token pair.

    Args:
        refresh_token_str: Valid refresh token string.

    Returns:
        Dict with new ``access`` and ``refresh`` string tokens.

    Raises:
        AuthenticationFailed: When the refresh token is invalid or blacklisted.
    """
    log_action(None, "TOKEN_REFRESH", "Token", None)
    try:
        return refresh_access_token(refresh_token_str)
    except TokenError:
        raise AuthenticationFailed("Invalid or expired refresh token.")


def request_email_verification(user) -> None:
    """
    Send an email-verification OTP to the user.

    Args:
        user: User requiring email verification.

    Returns:
        None.
    """
    otp_service.send(user, OTPPurpose.EMAIL_VERIFICATION)
    log_action(user, "EMAIL_VERIFICATION_REQUEST", "User", user.id)


def verify_email_otp(user, otp: str, device_info: dict | None = None) -> None:
    """
    Verify an email-verification OTP and optionally register the first device.

    Args:
        user: User submitting the OTP.
        otp: One-time password code.
        device_info: Optional device metadata used to trust the first device.

    Returns:
        None.
    """
    otp_service.verify(user, OTPPurpose.EMAIL_VERIFICATION, otp)

    user.is_email_verified = True
    if user.status == AccountStatus.PENDING:
        user.status = AccountStatus.ACTIVE
    user.save(update_fields=["is_email_verified", "status"])

    if device_info and not user.trusted_devices.filter(is_active=True).exists():
        device_service.register_device(user, device_info)

    log_action(user, "EMAIL_VERIFICATION_SUCCESS", "User", user.id)

def public_request_email_verification(email: str) -> None:
    """
    Send an email-verification OTP to a user identified by email (public endpoint).

    Args:
        email: Account email address.

    Returns:
        None. Does not reveal whether the email exists.
    """
    user = User.objects.filter(email__iexact=email).first()
    if user and not user.is_email_verified:
        otp_service.send(user, OTPPurpose.EMAIL_VERIFICATION)
        log_action(user, "EMAIL_VERIFICATION_REQUEST", "User", user.id)


def public_verify_email_otp(email: str, otp: str, device_info: dict | None = None) -> dict:
    """
    Verify an email-verification OTP for a user identified by email (public endpoint).

    Args:
        email: Account email address.
        otp: One-time password code.
        device_info: Optional device metadata used to trust the first device.

    Returns:
        Dict with ``access`` and ``refresh`` JWT strings on success.

    Raises:
        AuthenticationFailed: Unknown email.
        ValidationError: OTP verification failed.
    """
    user = User.objects.filter(email__iexact=email).prefetch_related("assignments").first()
    if not user:
        raise AuthenticationFailed("Invalid credentials.")

    otp_service.verify(user, OTPPurpose.EMAIL_VERIFICATION, otp)

    user.is_email_verified = True
    if user.status == AccountStatus.PENDING:
        user.status = AccountStatus.ACTIVE
    user.save(update_fields=["is_email_verified", "status"])

    if device_info and not user.trusted_devices.filter(is_active=True).exists():
        device_service.register_device(user, device_info)

    log_action(user, "EMAIL_VERIFICATION_SUCCESS", "User", user.id)

    # Issue tokens so the user is logged in immediately after verification
    log_action(user, "LOGIN", "User", user.id)
    return issue_tokens(user)


def request_device_verification(user, device_info: dict) -> None:
    """
    Send a device-verification OTP for a new device.

    Args:
        user: User requesting device trust.
        device_info: Device metadata stored in OTP challenge metadata.

    Returns:
        None.
    """
    otp_service.send(user, OTPPurpose.DEVICE_VERIFICATION, metadata=device_info)
    log_action(user, "DEVICE_VERIFICATION_REQUEST", "User", user.id)


def verify_device_otp(user, otp: str, device_info: dict):
    """
    Verify a device OTP and register the device as trusted.

    Args:
        user: User submitting the OTP.
        otp: One-time password code.
        device_info: Device metadata for registration.

    Returns:
        TrustedDevice instance created or updated.
    """
    log_action(user, "DEVICE_VERIFICATION_SUCCESS", "User", user.id)
    return device_service.verify_device(user, otp, device_info)


def forgot_password(email: str) -> None:
    """
    Initiate password reset by sending an OTP when the user exists.

    Args:
        email: Account email address.

    Returns:
        None. Does not reveal whether the email exists.
    """
    user = User.objects.filter(email__iexact=email).first()
    if user:
        otp_service.send(user, OTPPurpose.PASSWORD_RESET)
        log_action(user, "PASSWORD_RESET_REQUEST", "User", user.id)


def reset_password(otp: str, new_password: str) -> None:
    """
    Reset a password using a valid password-reset OTP.

    Args:
        otp: One-time password code.
        new_password: New plain-text password (validated against Django validators).

    Returns:
        None.

    Raises:
        ValidationError: No matching active OTP found.
    """
    active_challenges = OTPChallenge.objects.filter(
        purpose=OTPPurpose.PASSWORD_RESET,
        is_used=False,
    ).select_related("user")

    matched_challenge = None
    for challenge in active_challenges:
        if check_password(otp, challenge.otp_code):
            matched_challenge = challenge
            break

    if not matched_challenge:
        raise ValidationError("Invalid OTP code.")

    try:
        validate_password(new_password)
    except DjangoValidationError as e:
        raise ValidationError(e.messages)

    user = matched_challenge.user
    user.set_password(new_password)
    user.save(update_fields=["password"])

    matched_challenge.is_used = True
    matched_challenge.save(update_fields=["is_used"])

    log_action(user, "user.password_reset", "User", user.id)


def change_password(user, old_password: str, new_password: str, actor=None) -> None:
    """
    Change password for an authenticated user.

    Args:
        user: Authenticated User instance.
        old_password: Current plain-text password.
        new_password: New plain-text password.

    Returns:
        None.

    Raises:
        AuthenticationFailed: Old password does not match.
    """
    if not user.check_password(old_password):
        raise AuthenticationFailed("Invalid credentials.")
    
    if old_password == new_password:
        raise ValidationError("New password must be different from the old password.")
    
    try:
        validate_password(new_password)
    except DjangoValidationError as e:
        raise ValidationError(e.messages)

    user.set_password(new_password)

    user.save(update_fields=["password"])

    log_action(actor, "CHANGED_PASSWORD", "User", user.id)
