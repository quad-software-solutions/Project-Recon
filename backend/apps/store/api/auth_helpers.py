import uuid

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_super_admin,
)

CART_TOKEN_MAX_AGE = 30 * 24 * 3600
_signer = TimestampSigner()


def generate_cart_token(cart_id) -> str:
    return _signer.sign(str(cart_id))


def verify_cart_token(token: str, cart_id) -> bool:
    try:
        unsigned = _signer.unsign(token, max_age=CART_TOKEN_MAX_AGE)
        return unsigned == str(cart_id)
    except (BadSignature, SignatureExpired):
        return False


def check_pending_order_access(pending_order, request):
    if pending_order.user and request.user.is_authenticated:
        if pending_order.user.pk != request.user.pk:
            raise NotFound("Pending order not found.")
    elif pending_order.user and not request.user.is_authenticated:
        raise NotFound("Pending order not found.")
    elif not pending_order.user and not request.user.is_authenticated:
        token = request.headers.get("X-Order-Token")
        if not token:
            raise NotFound("Pending order not found.")
        try:
            if pending_order.access_token != uuid.UUID(token):
                raise NotFound("Pending order not found.")
        except (ValueError, TypeError):
            raise NotFound("Pending order not found.")


def filter_by_branch(user, queryset):
    if user_is_branch_manager(user):
        return queryset.filter(branch_id__in=get_active_branch_ids(user))
    return queryset
