from datetime import date

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.academic.constants import EnrollmentStatus, PaymentStatus, VerificationStatus
from apps.academic.models import (
    AttendanceRecord, BranchTransferRequest, Enrollment,
    EnrollmentPayment, StudentProgress,
)
from apps.academic.services.enrollment_service import _generate_enrollment_number
from apps.shared.audit.services import log_action


def get_transfer_request_or_404(pk):
    from django.shortcuts import get_object_or_404
    return get_object_or_404(
        BranchTransferRequest.objects.select_related(
            "enrollment", "from_branch", "to_branch", "target_class",
            "requested_by", "approved_by",
        ),
        pk=pk,
    )


def list_transfer_requests():
    return BranchTransferRequest.objects.select_related(
        "enrollment", "from_branch", "to_branch", "target_class",
        "requested_by", "approved_by",
    ).all()


def request_transfer(actor, *, enrollment, target_class, to_branch):
    if enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError("Enrollment must be active to request a transfer.")

    source_class = enrollment.enrolled_class
    if source_class.branch_id == to_branch.id:
        raise ValidationError("Destination branch must differ from the current branch.")

    if not target_class.is_active:
        raise ValidationError("Target class is not active.")

    if target_class.branch_id != to_branch.id:
        raise ValidationError("Target class must belong to the destination branch.")

    if target_class.class_type == source_class.class_type and target_class.capacity:
        from apps.academic.models.class_model import Class as ClassModel
        active_count = Enrollment.objects.filter(
            enrolled_class=target_class,
            status=EnrollmentStatus.ACTIVE,
        ).count()
        if active_count >= target_class.capacity:
            raise ValidationError("Target class has reached maximum capacity.")

    if BranchTransferRequest.objects.filter(
        enrollment=enrollment,
        status=BranchTransferRequest.TransferStatus.PENDING,
    ).exists():
        raise ValidationError("A pending transfer request already exists for this enrollment.")

    transfer_request = BranchTransferRequest(
        enrollment=enrollment,
        from_branch=source_class.branch,
        to_branch=to_branch,
        target_class=target_class,
        requested_by=actor,
        status=BranchTransferRequest.TransferStatus.PENDING,
    )
    transfer_request.full_clean()
    transfer_request.save()

    log_action(
        actor=actor,
        action="transfer.requested",
        resource_type="BranchTransferRequest",
        resource_id=transfer_request.id,
        branch=enrollment.enrolled_class.branch,
        details={
            "enrollment_id": str(enrollment.id),
            "from_branch": str(source_class.branch_id),
            "to_branch": str(to_branch.id),
            "target_class": str(target_class.id),
        },
    )

    return transfer_request


def _repoint_records(old_enrollment, new_enrollment):
    AttendanceRecord.objects.filter(enrollment=old_enrollment).update(
        enrollment=new_enrollment
    )
    StudentProgress.objects.filter(enrollment=old_enrollment).update(
        enrollment=new_enrollment
    )


@transaction.atomic
def approve_transfer(actor, *, transfer_request):
    if transfer_request.status != BranchTransferRequest.TransferStatus.PENDING:
        raise ValidationError("Only pending transfer requests can be approved.")

    old_enrollment = transfer_request.enrollment
    target_class = transfer_request.target_class
    to_branch = transfer_request.to_branch

    if old_enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError("Original enrollment is no longer active.")

    year = date.today().year
    enrollment_number = _generate_enrollment_number(to_branch.code, year)

    old_enrollment.status = EnrollmentStatus.CANCELLED
    old_enrollment.save(update_fields=["status", "updated_at"])

    new_enrollment = Enrollment(
        student=old_enrollment.student,
        enrolled_class=target_class,
        status=EnrollmentStatus.ACTIVE,
        enrollment_number=enrollment_number,
        transferred_from=old_enrollment,
    )
    new_enrollment.full_clean()
    new_enrollment.save()

    EnrollmentPayment.objects.create(
        enrollment=new_enrollment,
        amount=0,
        status=PaymentStatus.PAID,
        verified_by=actor,
        verified_at=timezone.now(),
        verification_notes="Branch transfer — no fee change",
    )

    _repoint_records(old_enrollment, new_enrollment)

    transfer_request.status = BranchTransferRequest.TransferStatus.APPROVED
    transfer_request.approved_by = actor
    transfer_request.approved_at = timezone.now()
    transfer_request.save(update_fields=["status", "approved_by", "approved_at"])

    log_action(
        actor=actor,
        action="transfer.approved",
        resource_type="BranchTransferRequest",
        resource_id=transfer_request.id,
        branch=to_branch,
        details={
            "old_enrollment_id": str(old_enrollment.id),
            "new_enrollment_id": str(new_enrollment.id),
            "from_branch": str(transfer_request.from_branch_id),
            "to_branch": str(to_branch.id),
        },
    )

    return new_enrollment, transfer_request


@transaction.atomic
def reject_transfer(actor, *, transfer_request, rejection_reason):
    if transfer_request.status != BranchTransferRequest.TransferStatus.PENDING:
        raise ValidationError("Only pending transfer requests can be rejected.")

    transfer_request.status = BranchTransferRequest.TransferStatus.REJECTED
    transfer_request.rejection_reason = rejection_reason
    transfer_request.save(update_fields=["status", "rejection_reason"])

    log_action(
        actor=actor,
        action="transfer.rejected",
        resource_type="BranchTransferRequest",
        resource_id=transfer_request.id,
        branch=transfer_request.enrollment.enrolled_class.branch,
        details={
            "enrollment_id": str(transfer_request.enrollment.id),
            "rejection_reason": rejection_reason,
        },
    )

    return transfer_request
