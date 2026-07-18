"""
JWT token helpers wrapping simplejwt.

Infrastructure layer only — business services must call these helpers
instead of importing DRF or simplejwt directly.
"""

from django.contrib.auth import get_user_model

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed

from apps.shared.audit.services import log_action


def issue_tokens_for_user(user, device_info: dict | None = None) -> dict:
    """
    Issue a new access/refresh token pair for the given user.

    Args:
        user: Authenticated User instance.
        device_info: Optional device metadata — fingerprint is embedded
            in the refresh token for proof-of-possession on refresh.

    Returns:
        Dict with ``access`` and ``refresh`` string tokens.

    Raises:
        AuthenticationFailed: When the user account is not active.
    """
    if not user.is_active_account:
        raise AuthenticationFailed("Account is not active.")
    refresh = RefreshToken.for_user(user)
    fingerprint = device_info.get("fingerprint") if device_info else None
    if fingerprint:
        refresh["fingerprint"] = fingerprint
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def blacklist_refresh_token(refresh_token_str: str) -> None:
    """
    Blacklist a refresh token so it cannot be reused.

    Args:
        refresh_token_str: Raw refresh token string from the client.

    Returns:
        None. Invalid tokens are ignored silently.
    """
    if not refresh_token_str:
        return
    try:
        token = RefreshToken(refresh_token_str)
        token.blacklist()
        log_action(None, "TOKEN_BLACKLIST", "Token", None)
    except (TokenError, Exception):
        pass


def refresh_access_token(refresh_token_str: str, device_info: dict | None = None) -> dict:
    """
    Rotate a refresh token and return a new token pair.

    Validates device fingerprint proof-of-possession when the original
    token was issued with a fingerprint claim.

    Args:
        refresh_token_str: Valid refresh token string.
        device_info: Optional device metadata — fingerprint is checked
            against the claim stored when the token was issued.

    Returns:
        Dict with new ``access`` and ``refresh`` string tokens.

    Raises:
        TokenError: When the refresh token is invalid or blacklisted.
        AuthenticationFailed: When the user account is not active, or
            when the device fingerprint does not match the original token.
    """
    old_refresh = RefreshToken(refresh_token_str)
    fingerprint_from_token = old_refresh.get("fingerprint")
    if fingerprint_from_token:
        submitted_fingerprint = device_info.get("fingerprint") if device_info else None
        if not submitted_fingerprint or submitted_fingerprint != fingerprint_from_token:
            raise AuthenticationFailed("Device fingerprint mismatch.")
    user_id = old_refresh["user_id"]
    user = get_user_model().objects.get(id=user_id)
    if not user.is_active_account:
        raise AuthenticationFailed("Account is not active.")
    old_refresh.blacklist()
    new_refresh = RefreshToken.for_user(user)
    new_fingerprint = device_info.get("fingerprint") if device_info else None
    if new_fingerprint:
        new_refresh["fingerprint"] = new_fingerprint
    return {
        "access": str(new_refresh.access_token),
        "refresh": str(new_refresh),
    }
