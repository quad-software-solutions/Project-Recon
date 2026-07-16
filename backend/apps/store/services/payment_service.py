import logging

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.shared.audit.services import log_action
from apps.store.constants import PaymentMethod, PaymentStatus
from apps.store.models.payment import StorePayment
from apps.store.models.pending_order import PendingOrder
from apps.store.services.pending_order_service import cancel_pending_order

logger = logging.getLogger(__name__)


def get_payment_or_404(pk):
    """
    Retrieve a StorePayment by primary key or raise NotFound.

    Args:
        pk: Payment UUID as string or UUID instance.

    Returns:
        StorePayment instance with related pending_order.
    """
    try:
        return StorePayment.objects.select_related(
            "pending_order__branch",
            "pending_order__user",
            "verified_by",
        ).get(id=pk)
    except StorePayment.DoesNotExist:
        raise NotFound("Payment not found.")


def list_payments(status=None, pending_order_id=None):
    """
    Return payments, optionally filtered.

    Args:
        status: Optional payment status to filter by.
        pending_order_id: Optional pending order UUID to filter by.

    Returns:
        QuerySet of StorePayment objects.
    """
    qs = StorePayment.objects.select_related(
        "pending_order__branch", "pending_order__user", "verified_by"
    ).all()
    if status:
        qs = qs.filter(status=status)
    if pending_order_id:
        qs = qs.filter(pending_order_id=pending_order_id)
    return qs


def submit_payment_evidence(
    pending_order,
    amount,
    payment_method,
    transaction_reference="",
    bank_name="",
    attachment=None,
    actor=None,
):
    """
    Submit payment evidence for a pending order, creating a payment
    record in PENDING_VERIFICATION status.

    Args:
        pending_order: PendingOrder instance.
        amount: Decimal payment amount.
        payment_method: PaymentMethod enum value.
        transaction_reference: Optional transaction reference string.
        bank_name: Optional bank name string.
        attachment: Optional uploaded file.
        actor: Optional User performing the action.

    Returns:
        Created StorePayment instance.

    Raises:
        ValidationError: If pending order already has a payment.
    """
    if not isinstance(pending_order, PendingOrder):
        try:
            pending_order = PendingOrder.objects.get(id=pending_order)
        except PendingOrder.DoesNotExist:
            raise NotFound("Pending order not found.")

    if hasattr(pending_order, "payment"):
        raise ValidationError("This pending order already has a payment record.")

    if amount <= 0:
        raise ValidationError("Payment amount must be greater than zero.")

    with transaction.atomic():
        payment = StorePayment(
            pending_order=pending_order,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference or "",
            bank_name=bank_name or "",
            attachment=attachment,
            status=PaymentStatus.PENDING_VERIFICATION,
        )
        payment.full_clean()
        payment.save()

        log_action(
            actor=actor,
            action="payment.evidence_submitted",
            resource_type="StorePayment",
            resource_id=payment.id,
        )

    return payment


def record_cash_payment(pending_order, amount, actor=None, payment_date=None):
    """
    Record a cash payment for a pending order.
    Cash payments are directly marked as VERIFIED and trigger order creation.

    Args:
        pending_order: PendingOrder instance (or UUID).
        amount: Decimal payment amount.
        actor: User performing the action (required for verification).
        payment_date: Optional datetime of payment.

    Returns:
        Created StorePayment instance.

    Raises:
        ValidationError: If pending order already has a payment.
        NotFound: If pending order not found.
    """
    if not isinstance(pending_order, PendingOrder):
        try:
            pending_order = PendingOrder.objects.select_related("branch").get(
                id=pending_order
            )
        except PendingOrder.DoesNotExist:
            raise NotFound("Pending order not found.")

    if hasattr(pending_order, "payment"):
        raise ValidationError("This pending order already has a payment record.")

    if amount <= 0:
        raise ValidationError("Payment amount must be greater than zero.")

    now = timezone.now()

    with transaction.atomic():
        payment = StorePayment(
            pending_order=pending_order,
            amount=amount,
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.VERIFIED,
            payment_date=payment_date or now,
            verified_by=actor,
            verified_at=now,
        )
        payment.full_clean()
        payment.save()

        log_action(
            actor=actor,
            action="payment.cash_recorded",
            resource_type="StorePayment",
            resource_id=payment.id,
        )

    from apps.store.services.order_service import create_order_from_pending_order

    create_order_from_pending_order(pending_order, actor=actor)

    return payment


def verify_payment(pending_order, actor, verification_notes=""):
    """
    Verify a pending payment, marking it as VERIFIED and creating the Order.

    Args:
        pending_order: PendingOrder instance.
        actor: User performing the verification.
        verification_notes: Optional notes from the verifier.

    Returns:
        Updated StorePayment instance.

    Raises:
        ValidationError: If payment is not in PENDING_VERIFICATION status.
        NotFound: If payment not found.
    """
    if not hasattr(pending_order, "payment"):
        raise NotFound("No payment record found for this pending order.")

    payment = pending_order.payment

    if payment.status != PaymentStatus.PENDING_VERIFICATION:
        raise ValidationError(
            f"Cannot verify a payment with status '{payment.status}'. "
            "Only PENDING_VERIFICATION payments can be verified."
        )

    now = timezone.now()

    with transaction.atomic():
        payment.status = PaymentStatus.VERIFIED
        payment.verified_by = actor
        payment.verified_at = now
        if verification_notes:
            payment.verification_notes = verification_notes
        payment.save()

        log_action(
            actor=actor,
            action="payment.verified",
            resource_type="StorePayment",
            resource_id=payment.id,
        )

    from apps.store.services.order_service import create_order_from_pending_order

    create_order_from_pending_order(pending_order, actor=actor)

    return payment


def reject_payment(pending_order, actor, verification_notes):
    """
    Reject a pending payment, marking it as REJECTED and cancelling
    the pending order.

    Args:
        pending_order: PendingOrder instance.
        actor: User performing the rejection.
        verification_notes: Required notes explaining the rejection.

    Returns:
        Updated StorePayment instance.

    Raises:
        ValidationError: If payment is not in PENDING_VERIFICATION status
                         or no notes provided.
        NotFound: If payment not found.
    """
    if not hasattr(pending_order, "payment"):
        raise NotFound("No payment record found for this pending order.")

    payment = pending_order.payment

    if payment.status != PaymentStatus.PENDING_VERIFICATION:
        raise ValidationError(
            f"Cannot reject a payment with status '{payment.status}'. "
            "Only PENDING_VERIFICATION payments can be rejected."
        )

    if not verification_notes:
        raise ValidationError(
            "Verification notes are required when rejecting a payment."
        )

    with transaction.atomic():
        payment.status = PaymentStatus.REJECTED
        payment.verified_by = actor
        payment.verified_at = timezone.now()
        payment.verification_notes = verification_notes
        payment.save()

        log_action(
            actor=actor,
            action="payment.rejected",
            resource_type="StorePayment",
            resource_id=payment.id,
        )

    cancel_pending_order(pending_order, actor=actor)

    return payment
