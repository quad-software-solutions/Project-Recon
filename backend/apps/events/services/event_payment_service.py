import logging

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.constants import PaymentMethod, PaymentStatus
from apps.events.models import EventPayment, EventRegistration
from apps.events.services.registration_service import approve_registration, reject_registration
from apps.shared.audit.services import log_action

logger = logging.getLogger(__name__)


def get_payment_or_404(pk):
    """
    Retrieve an EventPayment by primary key or raise NotFound.

    Args:
        pk: Payment UUID as string or UUID instance.

    Returns:
        EventPayment instance with related registration, event, and student.
    """
    try:
        return EventPayment.objects.select_related(
            "registration__event",
            "registration__student__user",
            "verified_by",
        ).get(id=pk)
    except EventPayment.DoesNotExist:
        raise NotFound("Payment not found.")


def list_payments(registration_id=None, status=None, event_id=None):
    """
    Return payments, optionally filtered.

    Args:
        registration_id: Optional registration UUID to filter by.
        status: Optional payment status to filter by.
        event_id: Optional event UUID to filter by.

    Returns:
        QuerySet of EventPayment objects.
    """
    qs = EventPayment.objects.select_related(
        "registration__event", "registration__student__user", "verified_by"
    ).all()
    if registration_id:
        qs = qs.filter(registration_id=registration_id)
    if status:
        qs = qs.filter(status=status)
    if event_id:
        qs = qs.filter(registration__event_id=event_id)
    return qs


def submit_payment_evidence(
    registration,
    amount,
    payment_method,
    transaction_reference="",
    bank_name="",
    attachment=None,
    actor=None,
):
    """
    Submit payment evidence for a registration, creating a payment
    record in PENDING_VERIFICATION status.

    Args:
        registration: EventRegistration instance.
        amount: Decimal payment amount.
        payment_method: PaymentMethod enum value.
        transaction_reference: Optional transaction reference string.
        bank_name: Optional bank name string.
        attachment: Optional uploaded file.
        actor: Optional User performing the action.

    Returns:
        Created EventPayment instance.

    Raises:
        ValidationError: If registration already has a payment or
                         business rules are violated.
    """
    if not isinstance(registration, EventRegistration):
        try:
            registration = EventRegistration.objects.select_related("event").get(
                id=registration
            )
        except EventRegistration.DoesNotExist:
            raise NotFound("Registration not found.")

    if hasattr(registration, "payment"):
        raise ValidationError("This registration already has a payment record.")

    if amount <= 0:
        raise ValidationError("Payment amount must be greater than zero.")

    with transaction.atomic():
        payment = EventPayment(
            registration=registration,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference or "",
            bank_name=bank_name or "",
            attachment=attachment,
            status=PaymentStatus.PENDING_VERIFICATION,
        )
        payment.full_clean()
        payment.save()

        registration.payment_status = PaymentStatus.PENDING_VERIFICATION
        registration.save(update_fields=["payment_status", "updated_at"])

        log_action(
            actor=actor,
            action="payment.evidence_submitted",
            resource_type="EventPayment",
            resource_id=payment.id,
        )

    return payment


def record_cash_payment(registration, amount, actor=None, payment_date=None):
    """
    Record a cash payment for a registration.
    Cash payments are directly marked as VERIFIED.

    Args:
        registration: EventRegistration instance (or UUID).
        amount: Decimal payment amount.
        actor: User performing the action (required for verification).
        payment_date: Optional datetime of payment.

    Returns:
        Created EventPayment instance.

    Raises:
        ValidationError: If registration already has a payment or rules violated.
        NotFound: If registration not found.
    """
    if not isinstance(registration, EventRegistration):
        try:
            registration = EventRegistration.objects.select_related("event").get(
                id=registration
            )
        except EventRegistration.DoesNotExist:
            raise NotFound("Registration not found.")

    if hasattr(registration, "payment"):
        raise ValidationError("This registration already has a payment record.")

    if amount <= 0:
        raise ValidationError("Payment amount must be greater than zero.")

    now = timezone.now()

    with transaction.atomic():
        payment = EventPayment(
            registration=registration,
            amount=amount,
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.VERIFIED,
            payment_date=payment_date or now,
            verified_by=actor,
            verified_at=now,
        )
        payment.full_clean()
        payment.save()

        registration.payment_status = PaymentStatus.VERIFIED
        registration.save(update_fields=["payment_status", "updated_at"])

        approve_registration(registration, actor=actor)

        log_action(
            actor=actor,
            action="payment.cash_recorded",
            resource_type="EventPayment",
            resource_id=payment.id,
        )

    return payment


def verify_payment(registration, actor, verification_notes=""):
    """
    Verify a pending payment, marking it as VERIFIED and approving
    the associated registration.

    Args:
        registration: EventRegistration instance.
        actor: User performing the verification.
        verification_notes: Optional notes from the verifier.

    Returns:
        Updated EventPayment instance.

    Raises:
        ValidationError: If payment is not in PENDING_VERIFICATION status.
        NotFound: If payment not found.
    """
    if not hasattr(registration, "payment"):
        raise NotFound("No payment record found for this registration.")

    payment = registration.payment

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

        registration.payment_status = PaymentStatus.VERIFIED
        registration.save(update_fields=["payment_status", "updated_at"])

        approve_registration(registration, actor=actor)

        log_action(
            actor=actor,
            action="payment.verified",
            resource_type="EventPayment",
            resource_id=payment.id,
        )

    return payment


def reject_payment(registration, actor, verification_notes):
    """
    Reject a pending payment, marking it as REJECTED and rejecting
    the associated registration.

    Args:
        registration: EventRegistration instance.
        actor: User performing the rejection.
        verification_notes: Required notes explaining the rejection.

    Returns:
        Updated EventPayment instance.

    Raises:
        ValidationError: If payment is not in PENDING_VERIFICATION status
                         or no notes provided.
        NotFound: If payment not found.
    """
    if not hasattr(registration, "payment"):
        raise NotFound("No payment record found for this registration.")

    payment = registration.payment

    if payment.status != PaymentStatus.PENDING_VERIFICATION:
        raise ValidationError(
            f"Cannot reject a payment with status '{payment.status}'. "
            "Only PENDING_VERIFICATION payments can be rejected."
        )

    if not verification_notes:
        raise ValidationError("Verification notes are required when rejecting a payment.")

    with transaction.atomic():
        payment.status = PaymentStatus.REJECTED
        payment.verified_by = actor
        payment.verified_at = timezone.now()
        payment.verification_notes = verification_notes
        payment.save()

        registration.payment_status = PaymentStatus.REJECTED
        registration.save(update_fields=["payment_status", "updated_at"])

        reject_registration(registration, actor=actor)

        log_action(
            actor=actor,
            action="payment.rejected",
            resource_type="EventPayment",
            resource_id=payment.id,
        )

    return payment
