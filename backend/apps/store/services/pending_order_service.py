from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.store.models.pending_order import PendingOrder


def get_pending_order_or_404(pk):
    try:
        return PendingOrder.objects.prefetch_related(
            "items__product__category"
        ).get(pk=pk)
    except PendingOrder.DoesNotExist:
        raise NotFound("Pending order not found.")


def get_user_pending_orders(user):
    return PendingOrder.objects.filter(user=user).prefetch_related(
        "items__product__category"
    )


def expire_expired_pending_orders() -> int:
    now = timezone.now()
    expired = PendingOrder.objects.filter(expires_at__lt=now)
    count, _ = expired.delete()
    return count
