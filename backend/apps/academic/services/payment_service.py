import logging
import re
from django.utils import timezone

from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.constants import (
    EnrollmentStatus,
    PaymentMethod,
    PaymentProvider,
    PaymentStatus,
)
from apps.academic.models import EnrollmentPayment, Enrollment
from apps.shared.audit.services import log_action
from apps.shared.payment.payment_service import (
    initialize_payment as shared_initialize_payment,
    verify_payment as shared_verify_payment,
)
from apps.shared.payment.exceptions import PaymentError

logger = logging.getLogger(__name__)

REFERENCE_PATTERN = re.compile(r"^ENROLL-[a-f0-9]{8}-[a-f0-9]{12}$")


def _flag_fraud(payment, enrollment, reason):
    logger.critical(
        "FRAUD DETECTED: payment=%s enrollment=%s reason=%s",
        payment.id,
        enrollment.id,
        reason,
    )
    payment.status = PaymentStatus.FAILED
    payment.save(update_fields=["status"])
    enrollment.status = EnrollmentStatus.CANCELLED
    enrollment.save(update_fields=["status"])
    log_action(
        actor=None,
        action="payment.fraud_detected",
        resource_type="EnrollmentPayment",
        resource_id=payment.id,
        branch=enrollment.enrolled_class.branch,
        details={"reason": reason},
    )


def get_payment_or_404(pk):
    return get_object_or_404(
        EnrollmentPayment.objects.select_related("enrollment__student__user"),
        pk=pk,
    )


def get_payment_by_reference(reference):
    return get_object_or_404(
        EnrollmentPayment.objects.select_related(
            "enrollment__student__user",
            "enrollment__enrolled_class__sub_program",
        ),
        transaction_reference=reference,
    )


def list_payments():
    return EnrollmentPayment.objects.select_related(
        "enrollment__student__user",
        "enrollment__enrolled_class__sub_program",
    ).all()


def create_cash_payment(actor, *, enrollment, amount, payment_date=None):
    enrollment = Enrollment.objects.select_related(
        "enrolled_class__sub_program"
    ).get(pk=enrollment.pk)

    if enrollment.status != EnrollmentStatus.PENDING_PAYMENT:
        raise ValidationError(
            "Cash payments can only be recorded for enrollments pending payment."
        )

    if hasattr(enrollment, "payment"):
        raise ValidationError("This enrollment already has a payment record.")

    with transaction.atomic():
        payment = EnrollmentPayment(
            enrollment=enrollment,
            amount=amount,
            payment_method=PaymentMethod.CASH,
            payment_provider=None,
            status=PaymentStatus.PAID,
            payment_date=payment_date or timezone.now(),
        )
        payment.full_clean()
        payment.save()

        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save(update_fields=["status"])

    log_action(
        actor=actor,
        action="payment.cash_created",
        resource_type="EnrollmentPayment",
        resource_id=payment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return payment


def initialize_online_payment(
    *,
    actor=None,
    enrollment,
    amount,
    reference,
    callback_url,
    return_url=None,
    customer,
):
    enrollment = Enrollment.objects.select_related(
        "enrolled_class__sub_program", "student__user"
    ).get(pk=enrollment.pk)

    if enrollment.status != EnrollmentStatus.PENDING_PAYMENT:
        raise ValidationError(
            "Online payments can only be initialized for enrollments pending payment."
        )

    if hasattr(enrollment, "payment"):
        raise ValidationError("This enrollment already has a payment record.")

    if amount <= 0:
        raise ValidationError("Payment amount must be greater than zero.")

    with transaction.atomic():
        payment = EnrollmentPayment(
            enrollment=enrollment,
            amount=amount,
            payment_method=PaymentMethod.ONLINE,
            payment_provider=None,
            transaction_reference=reference,
            status=PaymentStatus.PENDING,
        )
        payment.save()

        try:
            result = shared_initialize_payment(
                amount=amount,
                currency="ETB",
                reference=reference,
                callback_url=callback_url,
                customer=customer,
                return_url=return_url,
            )
        except PaymentError as e:
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=["status"])
            raise ValidationError(f"Payment initialization failed: {e}")

        payment.payment_provider = result["provider"]
        payment.transaction_reference = result["reference"]
        payment.save(update_fields=["payment_provider", "transaction_reference"])

    log_action(
        actor=actor,
        action="payment.online_initialized",
        resource_type="EnrollmentPayment",
        resource_id=payment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return payment, result["checkout_url"]


def verify_online_payment(*, reference):
    if not REFERENCE_PATTERN.match(reference):
        raise ValidationError("Invalid payment reference format.")

    payment = get_payment_by_reference(reference)
    enrollment = payment.enrollment

    if payment.status == PaymentStatus.PAID:
        return payment

    if payment.status != PaymentStatus.PENDING:
        raise ValidationError(
            f"Cannot verify payment in status '{payment.status}'."
        )

    if enrollment.status != EnrollmentStatus.PENDING_PAYMENT:
        raise ValidationError(
            "Enrollment is not in a payable state."
        )

    try:
        result = shared_verify_payment(reference)
    except PaymentError as e:
        logger.error("Payment verification infrastructure error: %s", e)
        raise ValidationError("Payment verification temporarily unavailable.")

    if result["amount"] is not None and result["amount"] != payment.amount:
        _flag_fraud(payment, enrollment, reason="amount_mismatch")
        raise ValidationError("Payment amount mismatch detected.")

    expected_fee = enrollment.enrolled_class.sub_program.fee
    if payment.amount != expected_fee:
        _flag_fraud(payment, enrollment, reason="fee_tampered")
        raise ValidationError("Payment fee mismatch detected.")

    if result.get("currency") and result["currency"] not in ("ETB",):
        _flag_fraud(payment, enrollment, reason="currency_mismatch")
        raise ValidationError("Payment currency mismatch detected.")

    with transaction.atomic():
        if result["status"] == "success":
            payment.status = PaymentStatus.PAID
            payment.payment_date = timezone.now()
            payment.payment_provider = result.get("provider", payment.payment_provider)
            payment.save()

            enrollment.status = EnrollmentStatus.ACTIVE
            enrollment.save(update_fields=["status"])

            if not enrollment.student.user.is_email_verified:
                user = enrollment.student.user
                user.is_email_verified = True
                user.save(update_fields=["is_email_verified"])

            log_action(
                actor=None,
                action="payment.verified_success",
                resource_type="EnrollmentPayment",
                resource_id=payment.id,
                branch=enrollment.enrolled_class.branch,
                details={"reference": reference},
            )

        elif result["status"] in ("failed", "cancelled"):
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=["status"])

            log_action(
                actor=None,
                action="payment.verified_failed",
                resource_type="EnrollmentPayment",
                resource_id=payment.id,
                branch=enrollment.enrolled_class.branch,
                details={"reference": reference, "provider_status": result.get("provider_status")},
            )

        else:
            logger.info(
                "Payment %s still pending after verification. reference=%s status=%s",
                payment.id,
                reference,
                result["status"],
            )

    return payment
