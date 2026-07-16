import logging
from datetime import datetime

from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.academic.constants import (
    EnrollmentStatus,
    PaymentMethod,
    PaymentStatus,
    VerificationStatus,
)
from apps.academic.models import EnrollmentPayment, Enrollment
from apps.academic.services.enrollment_service import _generate_enrollment_number
from apps.shared.audit.services import log_action

logger = logging.getLogger(__name__)


def get_payment_or_404(pk):
    return get_object_or_404(
        EnrollmentPayment.objects.select_related("enrollment__student__user"),
        pk=pk,
    )


def list_payments():
    return EnrollmentPayment.objects.select_related(
        "enrollment__student__user",
        "enrollment__enrolled_class__sub_program",
    ).all()


def record_payment(
    actor, *, enrollment, amount, payment_method, payment_date=None,
    transaction_reference="", bank_name="", transfer_reference="",
    attachment=None, verification_notes="",
):
    enrollment = Enrollment.objects.select_related(
        "enrolled_class__sub_program", "enrolled_class__branch"
    ).get(pk=enrollment.pk)

    if enrollment.status != EnrollmentStatus.PENDING_VERIFICATION:
        raise ValidationError(
            "Payments can only be recorded for enrollments pending verification."
        )

    if hasattr(enrollment, "payment"):
        raise ValidationError("This enrollment already has a payment record.")

    if payment_method != PaymentMethod.CASH:
        if not transaction_reference and not attachment:
            raise ValidationError(
                "At least a transaction reference or payment attachment "
                "is required for non-cash payments."
            )

    with transaction.atomic():
        payment = EnrollmentPayment(
            enrollment=enrollment,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference,
            bank_name=bank_name,
            transfer_reference=transfer_reference,
            attachment=attachment,
            status=PaymentStatus.PAID,
            payment_date=payment_date or timezone.now(),
            verified_by=actor,
            verified_at=timezone.now(),
            verification_notes=verification_notes,
        )
        payment.full_clean()
        payment.save()

        branch_code = enrollment.enrolled_class.branch.code if hasattr(
            enrollment.enrolled_class.branch, "code"
        ) else "GEN"
        year = timezone.now().year
        enrollment.enrollment_number = _generate_enrollment_number(branch_code, year)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.verification_status = VerificationStatus.VERIFIED
        enrollment.pending_code = None
        enrollment.save(
            update_fields=[
                "enrollment_number", "status", "verification_status", "pending_code"
            ]
        )

    log_action(
        actor=actor,
        action="payment.recorded",
        resource_type="EnrollmentPayment",
        resource_id=payment.id,
        branch=enrollment.enrolled_class.branch,
    )

    # TODO: send approved email with enrollment_number

    return payment


def reject_payment(actor, *, enrollment, rejection_reason):
    enrollment = Enrollment.objects.select_related(
        "enrolled_class__branch"
    ).get(pk=enrollment.pk)

    if enrollment.verification_status == VerificationStatus.REJECTED:
        raise ValidationError("Enrollment has already been rejected.")

    with transaction.atomic():
        enrollment.verification_status = VerificationStatus.REJECTED
        enrollment.rejection_reason = rejection_reason
        enrollment.status = EnrollmentStatus.REJECTED
        enrollment.save(
            update_fields=["verification_status", "rejection_reason", "status", "updated_at"]
        )

        try:
            payment = enrollment.payment
            payment.status = PaymentStatus.CANCELLED
            payment.save(update_fields=["status", "updated_at"])
        except EnrollmentPayment.DoesNotExist:
            pass

    log_action(
        actor=actor,
        action="payment.rejected",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrollment.enrolled_class.branch,
        details={"reason": rejection_reason},
    )

    # TODO: send rejection email

    return enrollment


def set_under_review(actor, *, enrollment):
    enrollment = Enrollment.objects.select_related(
        "enrolled_class__branch"
    ).get(pk=enrollment.pk)

    if enrollment.verification_status != VerificationStatus.SUBMITTED:
        raise ValidationError(
            "Only submitted enrollments can be marked as under review."
        )

    enrollment.verification_status = VerificationStatus.UNDER_REVIEW
    enrollment.save(update_fields=["verification_status", "updated_at"])

    log_action(
        actor=actor,
        action="payment.under_review",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return enrollment
