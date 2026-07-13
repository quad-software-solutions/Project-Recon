import logging
import re

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.shared.payment.exceptions import PaymentError
from apps.shared.payment.payment_service import (
    initialize_payment as shared_initialize_payment,
    verify_payment as shared_verify_payment,
)
from apps.store.constants import PaymentMethod, PaymentStatus
from apps.store.models.payment import StorePayment
from apps.store.models.pending_order import PendingOrder

logger = logging.getLogger(__name__)

REFERENCE_PREFIX = "STORE-"
REFERENCE_PATTERN = re.compile(rf"^{REFERENCE_PREFIX}[a-f0-9]{{8}}-[a-f0-9]{{12}}$")


def _generate_reference() -> str:
    import uuid
    return f"{REFERENCE_PREFIX}{uuid.uuid4().hex[:8]}-{uuid.uuid4().hex[:12]}"


def initialize_store_payment(
    pending_order: PendingOrder,
    callback_url: str,
    return_url: str = "",
    actor=None,
) -> StorePayment:
    if hasattr(pending_order, "payment"):
        raise ValidationError("A payment record already exists for this order.")

    reference = _generate_reference()

    payment = StorePayment.objects.create(
        pending_order=pending_order,
        amount=pending_order.total,
        transaction_reference=reference,
        status=PaymentStatus.PENDING,
    )

    try:
        customer = _build_customer(pending_order)
        result = shared_initialize_payment(
            amount=pending_order.total,
            currency="ETB",
            reference=reference,
            callback_url=callback_url,
            customer=customer,
            return_url=return_url,
        )

        payment.payment_provider = result.get("provider", "")
        payment.save(update_fields=["payment_provider"])

        pending_order.payment_reference = result.get("reference") or reference
        pending_order.save(update_fields=["payment_reference"])

    except PaymentError as e:
        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])
        logger.error("Payment initialization failed: %s", e)
        raise ValidationError(f"Payment initialization failed: {e}")

    return payment


def verify_store_payment(reference: str) -> StorePayment:
    if not REFERENCE_PATTERN.match(reference):
        raise ValidationError("Invalid payment reference format.")

    payment = _get_payment_by_reference(reference)
    if payment.status == PaymentStatus.PAID:
        return payment

    if payment.status != PaymentStatus.PENDING:
        raise ValidationError(
            f"Cannot verify payment in status '{payment.status}'."
        )

    try:
        result = shared_verify_payment(reference)
    except PaymentError as e:
        logger.error("Payment verification infrastructure error: %s", e)
        raise ValidationError("Payment verification temporarily unavailable.")

    if result["status"] == "success":
        payment.status = PaymentStatus.PAID
        payment.payment_date = timezone.now()
        payment.payment_provider = result.get("provider", payment.payment_provider)
        payment.save(update_fields=["status", "payment_date", "payment_provider"])

        pending_order = payment.pending_order
        pending_order.payment_reference = reference
        pending_order.save(update_fields=["payment_reference"])

    elif result["status"] in ("failed", "cancelled"):
        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])

    else:
        logger.info(
            "Payment %s still pending after verification. reference=%s status=%s",
            payment.id,
            reference,
            result["status"],
        )

    return payment


def _get_payment_by_reference(reference: str) -> StorePayment:
    try:
        return StorePayment.objects.select_related("pending_order").get(
            transaction_reference=reference
        )
    except StorePayment.DoesNotExist:
        raise ValidationError("Payment not found for the given reference.")


def _build_customer(pending_order: PendingOrder) -> dict:
    if pending_order.user:
        return {
            "email": pending_order.user.email,
            "first_name": pending_order.user.first_name or "",
            "last_name": pending_order.user.last_name or "",
            "phone_number": "",
        }
    name_parts = (pending_order.guest_name or "").split(" ", 1)
    return {
        "email": pending_order.guest_email or "",
        "first_name": name_parts[0] if name_parts else "",
        "last_name": name_parts[1] if len(name_parts) > 1 else "",
        "phone_number": pending_order.guest_phone or "",
    }
