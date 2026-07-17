"""
One-time password generation, delivery, and verification service.
"""

import secrets
import string
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound, Throttled

from apps.accounts.models import OTPChallenge
from apps.shared.audit.services import log_action
from apps.shared.email.services import send_email


def generate(user, purpose, metadata=None):
    """
    Create a new OTP challenge, invalidating any prior active challenge for the purpose.

    Args:
        user: OTP recipient.
        purpose: OTPPurpose constant.
        metadata: Optional JSON context (e.g. device fingerprint).

    Returns:
        Tuple of (OTPChallenge, raw_code string). Raw code is for delivery only.
    """
    active_challenge = OTPChallenge.objects.filter(
        user=user, purpose=purpose, is_used=False
    ).order_by("-created_at").first()

    resend_count = 0
    if active_challenge:
        if active_challenge.resend_count >= settings.AUTH_MAX_OTP_RESENDS:
            raise Throttled(detail="Maximum OTP resend limit exceeded.")
        
        active_challenge.is_used = True
        active_challenge.save(update_fields=["is_used"])
        resend_count = active_challenge.resend_count + 1

    code_length = settings.AUTH_OTP_LENGTH
    raw_code = "".join(secrets.choice(string.digits) for _ in range(code_length))
    hashed_code = make_password(raw_code)
    expires_at = timezone.now() + timedelta(minutes=settings.AUTH_OTP_EXPIRY_MINUTES)

    challenge = OTPChallenge.objects.create(
        user=user,
        purpose=purpose,
        otp_code=hashed_code,
        expires_at=expires_at,
        resend_count=resend_count,
        metadata=metadata,
    )

    log_action(user, "OTP_GENERATED", "OTPChallenge", challenge.id)
    return challenge, raw_code


def send(user, purpose, metadata=None) -> None:
    """
    Generate and email an OTP to the user.

    Args:
        user: OTP recipient.
        purpose: OTPPurpose constant.
        metadata: Optional JSON context stored on the challenge.
    """
    _challenge, raw_code = generate(user, purpose, metadata)
    subject = f"Your {purpose} Code"
    body = (
        f"Your one-time password is: {raw_code}\n"
        f"It expires in {settings.AUTH_OTP_EXPIRY_MINUTES} minutes."
    )
    send_email(user.email, subject, body)


def verify(user, purpose, code: str) -> bool:
    """
    Verify an OTP for the given user and purpose.

    Args:
        user: OTP owner.
        purpose: OTPPurpose constant.
        code: Submitted OTP string.

    Returns:
        True on success.

    Raises:
        NotFound, ValidationError, Throttled.
    """
    challenge = OTPChallenge.objects.filter(
        user=user, purpose=purpose, is_used=False
    ).order_by("-created_at").first()

    if not challenge:
        raise NotFound("No active OTP challenge found.")

    if challenge.expires_at < timezone.now():
        raise ValidationError("Invalid or expired OTP code.")

    if challenge.attempts >= settings.AUTH_MAX_OTP_ATTEMPTS:
        raise Throttled(detail="Invalid or expired OTP code.")

    challenge.attempts += 1

    if not check_password(code, challenge.otp_code):
        challenge.save(update_fields=["attempts"])
        raise ValidationError("Invalid or expired OTP code.")

    challenge.is_used = True
    challenge.save(update_fields=["attempts", "is_used"])

    log_action(user, "OTP_VERIFICATION_SUCCESS", "OTPChallenge", challenge.id)
    
    return True


def invalidate(user, purpose) -> None:
    """
    Mark all active OTP challenges for a purpose as used.

    Args:
        user: OTP owner.
        purpose: OTPPurpose constant.
    """
    OTPChallenge.objects.filter(
        user=user, purpose=purpose, is_used=False
    ).update(is_used=True)


def cleanup_expired() -> int:
    """
    Mark expired unused OTP challenges as used.

    Returns:
        Number of rows updated.
    """
    return OTPChallenge.objects.filter(
        is_used=False, expires_at__lt=timezone.now()
    ).update(is_used=True)
