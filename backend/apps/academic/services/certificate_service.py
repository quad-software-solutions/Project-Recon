import secrets
from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.models import Certificate, StudentCertificate
from apps.academic.services.learning_material_service import _reencode_image
from apps.shared.audit.services import log_action


def _validate_can_issue(actor, student, certificate):
    from apps.academic.constants import EnrollmentStatus
    from apps.academic.models import Enrollment
    from apps.accounts.permissions.roles import (
        get_active_branch_ids,
        user_is_branch_manager,
        user_is_secretary,
        user_is_super_admin,
    )
    if not any([
        user_is_super_admin(actor),
        user_is_branch_manager(actor),
        user_is_secretary(actor),
    ]):
        raise DjangoValidationError(
            "Only Super Admins, Branch Managers, and Secretaries may issue certificates."
        )

    if StudentCertificate.objects.filter(
        student=student, sub_program=certificate.sub_program,
    ).exists():
        raise DjangoValidationError(
            "A certificate has already been issued for this student and sub-program."
        )

    enrollments = Enrollment.objects.filter(
        student=student,
        enrolled_class__sub_program=certificate.sub_program,
        status__in=[EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
    ).select_related("enrolled_class__branch")
    if not enrollments.exists():
        raise DjangoValidationError(
            "Student is not enrolled in this sub-program."
        )
    if not user_is_super_admin(actor):
        branch_ids = get_active_branch_ids(actor)
        if not enrollments.filter(enrolled_class__branch_id__in=branch_ids).exists():
            raise DjangoValidationError(
                "Student's enrollment is not in a branch you manage."
            )


def generate_certificate_number(certificate):
    year = date.today().year
    rand = secrets.token_hex(4)
    return f"CERT-{certificate.sub_program.slug}-{year}-{rand}"


def _check_completion_warnings(actor, student, certificate):
    from apps.academic.constants import AttendanceStatus, EnrollmentStatus, ProgressStatus
    from apps.academic.models import AttendanceRecord, Enrollment, StudentProgress

    warnings = []

    enrollments = Enrollment.objects.filter(
        student=student,
        enrolled_class__sub_program=certificate.sub_program,
        status=EnrollmentStatus.COMPLETED,
    )
    if not enrollments.exists():
        warnings.append("Student does not have a COMPLETED enrollment in this sub-program.")

    milestones = list(certificate.sub_program.milestones.filter(is_active=True))
    if milestones:
        enrollment_ids = enrollments.values_list("id", flat=True)
        completed_milestone_ids = set(
            StudentProgress.objects.filter(
                enrollment_id__in=enrollment_ids,
                milestone__in=milestones,
                status=ProgressStatus.COMPLETED,
            ).values_list("milestone_id", flat=True)
        )
        milestone_ids = {m.id for m in milestones}
        missing = milestone_ids - completed_milestone_ids
        if missing:
            missing_titles = [
                m.title for m in milestones if m.id in missing
            ]
            warnings.append(
                f"Required milestones not completed: {', '.join(missing_titles)}."
            )

    enrollment_ids = enrollments.values_list("id", flat=True)
    if enrollment_ids:
        total_records = AttendanceRecord.objects.filter(
            enrollment_id__in=enrollment_ids,
        ).count()
        if total_records > 0:
            present_records = AttendanceRecord.objects.filter(
                enrollment_id__in=enrollment_ids,
                status=AttendanceStatus.PRESENT,
            ).count()
            rate = present_records / total_records
            threshold = 0.5
            if rate < threshold:
                warnings.append(
                    f"Student attendance rate ({rate:.0%}) is below {threshold:.0%}."
                )

    if warnings:
        log_action(
            actor=actor,
            action="STUDENT_CERTIFICATE_ISSUED_WITH_WARNINGS",
            resource_type="StudentCertificate",
            resource_id=None,
            details={"warnings": warnings, "student": str(student.id)},
        )

    return warnings


@transaction.atomic
def issue_certificate(actor, *, student, certificate):
    _validate_can_issue(actor, student, certificate)
    warnings = _check_completion_warnings(actor, student, certificate)

    number = generate_certificate_number(certificate)

    sc = StudentCertificate(
        student=student,
        certificate=certificate,
        sub_program=certificate.sub_program,
        certificate_number=number,
        issued_by=actor,
    )
    sc.full_clean()
    sc.save()

    log_action(
        actor=actor,
        action="STUDENT_CERTIFICATE_ISSUED",
        resource_type="StudentCertificate",
        resource_id=str(sc.id),
        details={"certificate_number": number},
    )
    return sc, warnings


def get_student_certificate_or_404(pk):
    return get_object_or_404(
        StudentCertificate.objects.select_related(
            "student__user", "sub_program", "certificate", "issued_by",
        ),
        pk=pk,
    )


def get_student_certificate_by_number(number):
    from django.shortcuts import get_object_or_404
    return get_object_or_404(
        StudentCertificate.objects.select_related(
            "student__user", "sub_program", "certificate", "issued_by",
        ),
        certificate_number=number,
    )


def get_student_certificates(student=None, sub_program=None):
    qs = StudentCertificate.objects.select_related(
        "student__user", "sub_program", "certificate", "issued_by",
    ).all()
    if student:
        qs = qs.filter(student=student)
    if sub_program:
        qs = qs.filter(sub_program=sub_program)
    return qs


def list_certificate_templates(sub_program=None, active_only=True):
    qs = Certificate.objects.select_related("sub_program").all()
    if sub_program:
        qs = qs.filter(sub_program=sub_program)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs


def get_certificate_template_or_404(pk):
    return get_object_or_404(
        Certificate.objects.select_related("sub_program"),
        pk=pk,
    )


def create_certificate(
    actor, *, sub_program, title, background, body_text,
    institute_logo=None, signature=None,
):
    from apps.shared.validators import validate_uploaded_file
    validate_uploaded_file(background)
    background = _reencode_image(background)
    if institute_logo:
        validate_uploaded_file(institute_logo)
        institute_logo = _reencode_image(institute_logo)
    if signature:
        validate_uploaded_file(signature)
        signature = _reencode_image(signature)

    cert = Certificate(
        sub_program=sub_program,
        title=title,
        background=background,
        institute_logo=institute_logo,
        signature=signature,
        body_text=body_text,
    )
    cert.full_clean()
    cert.save()

    log_action(
        actor=actor,
        action="CERTIFICATE_TEMPLATE_CREATED",
        resource_type="Certificate",
        resource_id=str(cert.id),
    )
    return cert


@transaction.atomic
def update_certificate(
    actor, certificate, *, title=None, body_text=None,
    background=None, institute_logo=None, signature=None,
):
    from apps.shared.validators import validate_uploaded_file
    if background is not None:
        validate_uploaded_file(background)
        background = _reencode_image(background)
        if certificate.background:
            certificate.background.delete(save=False)
        certificate.background = background
    if institute_logo is not None:
        if institute_logo:
            validate_uploaded_file(institute_logo)
            institute_logo = _reencode_image(institute_logo)
        if certificate.institute_logo:
            certificate.institute_logo.delete(save=False)
        certificate.institute_logo = institute_logo
    if signature is not None:
        if signature:
            validate_uploaded_file(signature)
            signature = _reencode_image(signature)
        if certificate.signature:
            certificate.signature.delete(save=False)
        certificate.signature = signature
    if title is not None:
        certificate.title = title
    if body_text is not None:
        certificate.body_text = body_text

    certificate.full_clean()
    certificate.save()

    log_action(
        actor=actor,
        action="CERTIFICATE_TEMPLATE_UPDATED",
        resource_type="Certificate",
        resource_id=str(certificate.id),
    )
    return certificate


def activate_certificate(actor, certificate):
    certificate.is_active = True
    certificate.save(update_fields=["is_active", "updated_at"])

    log_action(
        actor=actor,
        action="CERTIFICATE_TEMPLATE_ACTIVATED",
        resource_type="Certificate",
        resource_id=str(certificate.id),
    )
    return certificate


def deactivate_certificate(actor, certificate):
    certificate.is_active = False
    certificate.save(update_fields=["is_active", "updated_at"])

    log_action(
        actor=actor,
        action="CERTIFICATE_TEMPLATE_DEACTIVATED",
        resource_type="Certificate",
        resource_id=str(certificate.id),
    )
    return certificate
