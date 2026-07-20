import logging

from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.store.models.pending_order import PendingOrder

logger = logging.getLogger(__name__)


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
    from apps.shared.audit.services import log_action

    now = timezone.now()
    expired = PendingOrder.objects.filter(expires_at__lt=now)
    count = expired.count()
    if count:
        for po in expired.iterator():
            log_action(
                actor=None,
                action="pending_order.expired",
                resource_type="PendingOrder",
                resource_id=str(po.pk),
                details={
                    "expired_at": str(po.expires_at),
                    "total": str(po.total),
                    "guest_email": po.guest_email or "",
                },
            )
        logger.warning("Expired %d pending orders", count)
        expired.delete()
    return count


def verify_guest_email(pending_order, otp):
    from django.contrib.auth.hashers import check_password

    from apps.shared.audit.services import log_action

    if not isinstance(pending_order, PendingOrder):
        try:
            pending_order = PendingOrder.objects.get(pk=pending_order)
        except PendingOrder.DoesNotExist:
            raise NotFound("Pending order not found.")

    if pending_order.email_verified:
        raise ValidationError("Email is already verified.")

    if not pending_order.email_verification_otp or not pending_order.email_verification_otp_expiry:
        raise ValidationError("No verification code has been sent for this order.")

    if timezone.now() > pending_order.email_verification_otp_expiry:
        raise ValidationError("Verification code has expired. Please place the order again.")

    if not check_password(otp, pending_order.email_verification_otp):
        raise ValidationError("Invalid verification code.")

    pending_order.email_verified = True
    pending_order.email_verification_otp = None
    pending_order.email_verification_otp_expiry = None
    pending_order.save(update_fields=["email_verified", "email_verification_otp", "email_verification_otp_expiry"])

    log_action(
        actor=None,
        action="pending_order.email_verified",
        resource_type="PendingOrder",
        resource_id=str(pending_order.pk),
    )

    return pending_order


def cancel_pending_order(pending_order, actor=None):
    from apps.shared.audit.services import log_action

    log_action(
        actor=actor,
        action="pending_order.cancelled",
        resource_type="PendingOrder",
        resource_id=str(pending_order.pk),
        details={
            "reason": "Payment rejected",
        },
    )

    logger.warning(
        "Pending order %s cancelled by %s",
        pending_order.pk, actor,
    )

    pending_order.delete()
