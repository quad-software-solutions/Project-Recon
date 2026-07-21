from datetime import date, timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import get_random_string

from apps.academic.constants import (
    ClassType,
    EnrollmentStatus,
    PaymentMethod,
    PaymentStatus,
    VerificationStatus,
)
from apps.academic.models import (
    AttendanceRecord, Enrollment, EnrollmentPeriod, EnrollmentPayment,
    Student, StudentProgress,
)
from apps.academic.models.class_model import Class as ClassModel
from apps.accounts.services import user_service
from apps.shared.audit.services import log_action
from apps.shared.email.services import send_email


def _generate_enrollment_number(branch_code: str, year: int) -> str:
    prefix = f"ENR-{branch_code}-{year}-"
    last = Enrollment.objects.filter(
        enrollment_number__startswith=prefix
    ).order_by("enrollment_number").last()
    if last:
        seq = int(last.enrollment_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:06d}"


def _generate_pending_code(branch_code: str, year: int) -> str:
    prefix = f"ENR-P-{branch_code}-{year}-"
    last = Enrollment.objects.filter(
        pending_code__startswith=prefix
    ).order_by("pending_code").last()
    if last:
        seq = int(last.pending_code.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:06d}"


def _resolve_fee(enrolled_class) -> int:
    if enrolled_class.class_type == ClassType.GROUP:
        return enrolled_class.sub_program.group_fee
    fee = enrolled_class.sub_program.individual_fee
    if fee is None:
        raise ValidationError("Individual fee is not set for this sub-program.")
    return fee


def get_enrollment_or_404(pk):
    return get_object_or_404(
        Enrollment.objects.select_related(
            "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
        ).prefetch_related("payment"),
        pk=pk,
    )


def list_enrollments(branch_ids=None):
    qs = Enrollment.objects.select_related(
        "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
    )
    if branch_ids:
        qs = qs.filter(enrolled_class__branch_id__in=branch_ids)
    return qs.all()


def _validate_enrollment_period(enrolled_class):
    if enrolled_class.class_type != ClassType.GROUP:
        return
    today = date.today()
    period = EnrollmentPeriod.objects.filter(
        branch=enrolled_class.branch,
        program=enrolled_class.sub_program.program,
        sub_program=enrolled_class.sub_program,
        class_type=enrolled_class.class_type,
        is_active=True,
        start_date__lte=today,
        end_date__gte=today,
    ).exists()
    if not period:
        raise ValidationError(
            "No active enrollment period exists for this group class."
        )


def _validate_class_capacity(enrolled_class):
    if enrolled_class.class_type == ClassType.INDIVIDUAL:
        return
    active_count = Enrollment.objects.filter(
        enrolled_class=enrolled_class,
        status__in=[EnrollmentStatus.PENDING_VERIFICATION, EnrollmentStatus.ACTIVE],
    ).count()
    if enrolled_class.capacity and active_count >= enrolled_class.capacity:
        raise ValidationError("Class has reached maximum capacity.")


def enroll_student(actor, *, student, enrolled_class, remarks=""):
    _validate_enrollment_period(enrolled_class)
    _validate_class_capacity(enrolled_class)

    existing = Enrollment.objects.filter(
        student=student,
        enrolled_class=enrolled_class,
        status__in=[EnrollmentStatus.PENDING_VERIFICATION, EnrollmentStatus.ACTIVE],
    ).exists()
    if existing:
        raise ValidationError("Student is already enrolled in this class.")

    with transaction.atomic():
        enrollment = Enrollment(
            student=student,
            enrolled_class=enrolled_class,
            status=EnrollmentStatus.PENDING_VERIFICATION,
            remarks=remarks,
        )
        enrollment.full_clean()
        enrollment.save()

    log_action(
        actor=actor,
        action="enrollment.created",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrolled_class.branch,
    )

    return enrollment


def online_enrollment(
    *,
    user=None,
    enrolled_class,
    payment_method,
    transaction_reference="",
    bank_name="",
    transfer_reference="",
    attachment=None,
    email=None,
    first_name=None,
    last_name=None,
    password=None,
    phone_number=None,
    guardian_name="",
    guardian_phone="",
    guardian_email="",
):
    if user and user.is_authenticated:
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            raise ValidationError("Authenticated user does not have a student profile.")
    else:
        if not all([email, first_name, last_name, password]):
            raise ValidationError(
                "Email, first name, last name, and password are required for new students."
            )

    if payment_method != PaymentMethod.CASH:
        if not transaction_reference and not attachment:
            raise ValidationError(
                "At least a transaction reference or payment attachment "
                "is required for non-cash payments."
            )

    _validate_enrollment_period(enrolled_class)
    _validate_class_capacity(enrolled_class)

    if user and user.is_authenticated:
        existing = Enrollment.objects.filter(
            student=student,
            enrolled_class=enrolled_class,
            status__in=[EnrollmentStatus.PENDING_VERIFICATION, EnrollmentStatus.ACTIVE],
        ).exists()
        if existing:
            raise ValidationError("Already enrolled in this class.")

    amount = _resolve_fee(enrolled_class)

    with transaction.atomic():
        if not (user and user.is_authenticated):
            created_user = user_service.create_student_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                branch=enrolled_class.branch,
                assigned_by=None,
            )
            if phone_number:
                created_user.phone_number = phone_number
                created_user.save(update_fields=["phone_number"])
            student = Student.objects.create(
                user=created_user,
                branch=enrolled_class.branch,
                date_joined=date.today(),
                guardian_name=guardian_name,
                guardian_phone=guardian_phone,
                guardian_email=guardian_email,
            )

            existing = Enrollment.objects.filter(
                student=student,
                enrolled_class=enrolled_class,
                status__in=[EnrollmentStatus.PENDING_VERIFICATION, EnrollmentStatus.ACTIVE],
            ).exists()
            if existing:
                raise ValidationError("Already enrolled in this class.")

        year = date.today().year
        pending_code = _generate_pending_code(enrolled_class.branch.code, year)

        enrollment = Enrollment(
            student=student,
            enrolled_class=enrolled_class,
            status=EnrollmentStatus.PENDING_VERIFICATION,
            pending_code=pending_code,
            verification_status=VerificationStatus.SUBMITTED,
        )
        enrollment.full_clean()
        enrollment.save()

        payment = EnrollmentPayment(
            enrollment=enrollment,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference,
            bank_name=bank_name,
            transfer_reference=transfer_reference,
            attachment=attachment,
            status=PaymentStatus.PENDING,
        )
        payment.full_clean()
        payment.save()

    otp = get_random_string(length=6, allowed_chars="0123456789")
    enrollment.email_verification_otp = make_password(otp)
    enrollment.email_verification_otp_expiry = timezone.now() + timedelta(minutes=10)
    enrollment.save(update_fields=["email_verification_otp", "email_verification_otp_expiry"])

    student_email = student.user.email
    student_full_name = student.user.full_name
    otp_subject = "Email Verification — Ethio Robo Robotics"
    otp_body = (
        f"Dear {student_full_name},\n\n"
        f"Your email verification code is: {otp}\n\n"
        f"This code will expire in 10 minutes.\n\n"
        f"If you did not submit this enrollment, please ignore this email.\n\n"
        f"Thank you,\n"
        f"Ethio Robo Robotics"
    )
    send_email(student_email, otp_subject, otp_body)

    log_action(
        actor=student.user if user else None,
        action="enrollment.online_created",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrolled_class.branch,
    )

    recipient = student.user.email
    full_name = student.user.full_name
    class_name = enrolled_class.name
    branch_name = enrolled_class.branch.name if hasattr(enrolled_class.branch, "name") else str(enrolled_class.branch)
    status_display = EnrollmentStatus.PENDING_VERIFICATION.label
    subject = f"Enrollment Submitted — {pending_code}"
    body = (
        f"Dear {full_name},\n\n"
        f"Your enrollment has been submitted successfully.\n\n"
        f"- Reference: {pending_code}\n"
        f"- Class: {class_name}\n"
        f"- Branch: {branch_name}\n"
        f"- Status: {status_display}\n"
        f"- Amount: {amount} ETB\n\n"
        f"What happens next?\n"
        f"Your enrollment is pending verification. "
        f"You will be notified once your payment has been approved.\n\n"
        f"Thank you for choosing Ethio Robo Robotics \n\n"
    )
    send_email(recipient, subject, body)

    return enrollment


def cancel_enrollment(actor, enrollment):
    if enrollment.status not in [
        EnrollmentStatus.PENDING_VERIFICATION,
        EnrollmentStatus.ACTIVE,
    ]:
        raise ValidationError(
            f"Cannot cancel enrollment with status '{enrollment.status}'."
        )

    with transaction.atomic():
        locked = Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        locked.status = EnrollmentStatus.CANCELLED
        locked.save(update_fields=["status", "updated_at"])

    log_action(
        actor=actor,
        action="enrollment.cancelled",
        resource_type="Enrollment",
        resource_id=locked.id,
        branch=enrollment.enrolled_class.branch,
    )

    return locked


def complete_enrollment(actor, enrollment):
    if enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError(
            f"Only active enrollments can be completed. Current status: '{enrollment.status}'."
        )

    with transaction.atomic():
        locked = Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        locked.status = EnrollmentStatus.COMPLETED
        locked.save(update_fields=["status", "updated_at"])

    log_action(
        actor=actor,
        action="enrollment.completed",
        resource_type="Enrollment",
        resource_id=locked.id,
        branch=enrollment.enrolled_class.branch,
    )

    return locked


def move_enrollment(actor, *, enrollment, target_class):
    if enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError("Only active enrollments can be moved.")

    if not target_class.is_active:
        raise ValidationError("Target class is not active.")

    source_class = enrollment.enrolled_class
    if source_class.branch_id != target_class.branch_id:
        raise ValidationError("Cannot move enrollment to a different branch.")

    if target_class.class_type == ClassType.GROUP:
        if target_class.capacity:
            active_count = Enrollment.objects.filter(
                enrolled_class=target_class,
                status=EnrollmentStatus.ACTIVE,
            ).count()
            if active_count >= target_class.capacity:
                raise ValidationError("Target class has reached maximum capacity.")

        _validate_enrollment_period(target_class)

    duplicate = Enrollment.objects.filter(
        student=enrollment.student,
        enrolled_class=target_class,
        status=EnrollmentStatus.ACTIVE,
    ).exclude(pk=enrollment.pk).exists()
    if duplicate:
        raise ValidationError("Student already has an active enrollment in the target class.")

    with transaction.atomic():
        old_class_name = str(source_class)
        enrollment.enrolled_class = target_class
        enrollment.save(update_fields=["enrolled_class", "updated_at"])

    log_action(
        actor=actor,
        action="enrollment.moved",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=source_class.branch,
        details={
            "old_class": old_class_name,
            "new_class": str(target_class),
            "old_class_id": str(source_class.id),
            "new_class_id": str(target_class.id),
        },
    )

    return enrollment


def bulk_move_enrollments(actor, *, source_class, target_class, enrollment_ids=None, count=None):
    if not enrollment_ids and not count:
        raise ValidationError("Provide either enrollment_ids or count.")
    if enrollment_ids and count:
        raise ValidationError("Provide either enrollment_ids or count, not both.")

    if not target_class.is_active:
        raise ValidationError("Target class is not active.")

    if source_class.branch_id != target_class.branch_id:
        raise ValidationError("Cannot move enrollments to a different branch.")

    if target_class.class_type == ClassType.GROUP and target_class.capacity:
        _validate_enrollment_period(target_class)

    if enrollment_ids:
        enrollments_to_move = Enrollment.objects.filter(
            pk__in=enrollment_ids,
            enrolled_class=source_class,
            status=EnrollmentStatus.ACTIVE,
        )
    else:
        enrollments_to_move = Enrollment.objects.filter(
            enrolled_class=source_class,
            status=EnrollmentStatus.ACTIVE,
        ).order_by("enrolled_at")[:count]

    if not enrollments_to_move.exists():
        raise ValidationError("No active enrollments found to move.")

    warnings = []
    if target_class.capacity:
        current_count = Enrollment.objects.filter(
            enrolled_class=target_class,
            status=EnrollmentStatus.ACTIVE,
        ).count()
        if current_count + enrollments_to_move.count() > target_class.capacity:
            warnings.append(
                f"Moving these enrollments will exceed target class capacity "
                f"({target_class.capacity})."
            )

    for e in enrollments_to_move:
        duplicate = Enrollment.objects.filter(
            student=e.student,
            enrolled_class=target_class,
            status=EnrollmentStatus.ACTIVE,
        ).exclude(pk=e.pk).exists()
        if duplicate:
            raise ValidationError(
                f"Student {e.student.id} already has an active enrollment in the target class."
            )

    with transaction.atomic():
        moved_ids = list(enrollments_to_move.values_list("id", flat=True))
        Enrollment.objects.filter(id__in=moved_ids).update(
            enrolled_class=target_class
        )

    log_action(
        actor=actor,
        action="enrollment.bulk_moved",
        resource_type="Class",
        resource_id=source_class.id,
        branch=source_class.branch,
        details={
            "count": len(moved_ids),
            "old_class_id": str(source_class.id),
            "new_class_id": str(target_class.id),
            "old_class": str(source_class),
            "new_class": str(target_class),
            "enrollment_ids": [str(eid) for eid in moved_ids],
        },
    )

    if warnings:
        log_action(
            actor=actor,
            action="enrollment.bulk_moved_capacity_warning",
            resource_type="Class",
            resource_id=source_class.id,
            branch=source_class.branch,
            details={"warnings": warnings},
        )

    return Enrollment.objects.filter(id__in=moved_ids).select_related(
        "student__user", "enrolled_class__sub_program"
    ), warnings


def switch_subprogram(actor, *, current_enrollment, target_class):
    if current_enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError("Only active enrollments can switch subprograms.")

    if not target_class.is_active:
        raise ValidationError("Target class is not active.")

    if target_class.branch_id != current_enrollment.enrolled_class.branch_id:
        raise ValidationError("Cannot switch to a class in a different branch.")

    if target_class.class_type == ClassType.GROUP:
        _validate_enrollment_period(target_class)
        if target_class.capacity:
            active_count = Enrollment.objects.filter(
                enrolled_class=target_class,
                status=EnrollmentStatus.ACTIVE,
            ).count()
            if active_count >= target_class.capacity:
                raise ValidationError("Target class has reached maximum capacity.")

    duplicate = Enrollment.objects.filter(
        student=current_enrollment.student,
        enrolled_class=target_class,
        status=EnrollmentStatus.ACTIVE,
    ).exclude(pk=current_enrollment.pk).exists()
    if duplicate:
        raise ValidationError("Student already has an active enrollment in the target class.")

    old_amount = _resolve_fee(current_enrollment.enrolled_class)
    new_amount = _resolve_fee(target_class)
    amount_due = max(0, new_amount - old_amount)

    with transaction.atomic():
        old_enrollment_pk = current_enrollment.pk
        locked_enrollment = Enrollment.objects.select_for_update().get(pk=current_enrollment.pk)
        locked_enrollment.status = EnrollmentStatus.CANCELLED
        locked_enrollment.save(update_fields=["status", "updated_at"])

        year = date.today().year
        enrollment_number = _generate_enrollment_number(
            target_class.branch.code, year
        )

        new_enrollment = Enrollment(
            student=locked_enrollment.student,
            enrolled_class=target_class,
            status=EnrollmentStatus.ACTIVE,
            enrollment_number=enrollment_number,
            transferred_from=locked_enrollment,
        )
        new_enrollment.full_clean()
        new_enrollment.save()

        if amount_due > 0:
            notes = "Subprogram switch — difference"
        else:
            notes = "Subprogram switch — no fee change"

        EnrollmentPayment.objects.create(
            enrollment=new_enrollment,
            amount=amount_due,
            status=PaymentStatus.PAID,
            verified_by=actor,
            verified_at=timezone.now(),
            verification_notes=notes,
        )

        AttendanceRecord.objects.filter(enrollment=locked_enrollment).update(
            enrollment=new_enrollment
        )
        StudentProgress.objects.filter(enrollment=locked_enrollment).update(
            enrollment=new_enrollment
        )

    log_action(
        actor=actor,
        action="enrollment.subprogram_switched",
        resource_type="Enrollment",
        resource_id=new_enrollment.id,
        branch=target_class.branch,
        details={
            "old_enrollment_id": str(old_enrollment_pk),
            "new_enrollment_id": str(new_enrollment.id),
            "old_class_id": str(current_enrollment.enrolled_class_id),
            "new_class_id": str(target_class.id),
            "amount_due": str(amount_due),
        },
    )

    return new_enrollment, amount_due


def get_all_related_enrollments(enrollment):
    chain = [enrollment]
    current = enrollment
    while current.transferred_from:
        current = current.transferred_from
        chain.insert(0, current)
    return chain


def verify_online_enrollment_email(enrollment, otp):
    """Verify the OTP for an online enrollment's email address.

    Args:
        enrollment: Enrollment instance with OTP fields set.
        otp: The 6-digit code submitted by the user.

    Raises:
        ValidationError: If already verified, no OTP exists, expired, or wrong code.

    Returns:
        The updated Enrollment instance.
    """
    if enrollment.email_verified:
        raise ValidationError("Email is already verified.")

    if not enrollment.email_verification_otp or not enrollment.email_verification_otp_expiry:
        raise ValidationError("No verification code has been sent for this enrollment.")

    if timezone.now() > enrollment.email_verification_otp_expiry:
        raise ValidationError("Verification code has expired. Please submit a new enrollment.")

    if not check_password(otp, enrollment.email_verification_otp):
        raise ValidationError("Invalid verification code.")

    enrollment.email_verified = True
    enrollment.email_verification_otp = None
    enrollment.email_verification_otp_expiry = None
    enrollment.save(update_fields=["email_verified", "email_verification_otp", "email_verification_otp_expiry"])

    log_action(
        actor=None,
        action="enrollment.email_verified",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return enrollment
