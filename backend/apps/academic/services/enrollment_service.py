import uuid
from datetime import date

from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.constants import EnrollmentStatus
from apps.academic.models import Enrollment, Student, EnrollmentPeriod
from apps.academic.models.class_model import Class as ClassModel
from apps.academic.constants import ClassType
from apps.academic.services.payment_service import initialize_online_payment
from apps.accounts.services import user_service
from apps.shared.audit.services import log_action


REFERENCE_PATTERN = r"^ENROLL-[a-f0-9]{8}-[a-f0-9]{12}$"


def get_enrollment_or_404(pk):
    return get_object_or_404(
        Enrollment.objects.select_related(
            "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
        ).prefetch_related("payment"),
        pk=pk,
    )


def list_enrollments():
    return Enrollment.objects.select_related(
        "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
    ).all()


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
        status__in=[EnrollmentStatus.PENDING_PAYMENT, EnrollmentStatus.ACTIVE],
    ).count()
    if enrolled_class.capacity and active_count >= enrolled_class.capacity:
        raise ValidationError("Class has reached maximum capacity.")


def enroll_student(actor, *, student, enrolled_class, remarks=""):
    _validate_enrollment_period(enrolled_class)
    _validate_class_capacity(enrolled_class)

    existing = Enrollment.objects.filter(
        student=student,
        enrolled_class=enrolled_class,
        status__in=[EnrollmentStatus.PENDING_PAYMENT, EnrollmentStatus.ACTIVE],
    ).exists()
    if existing:
        raise ValidationError("Student is already enrolled in this class.")

    with transaction.atomic():
        enrollment = Enrollment(
            student=student,
            enrolled_class=enrolled_class,
            status=EnrollmentStatus.PENDING_PAYMENT,
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
    callback_url,
    return_url=None,
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

    _validate_enrollment_period(enrolled_class)
    _validate_class_capacity(enrolled_class)

    if user and user.is_authenticated:
        existing = Enrollment.objects.filter(
            student=student,
            enrolled_class=enrolled_class,
            status__in=[EnrollmentStatus.PENDING_PAYMENT, EnrollmentStatus.ACTIVE],
        ).exists()
        if existing:
            raise ValidationError("Already enrolled in this class.")

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
                status__in=[EnrollmentStatus.PENDING_PAYMENT, EnrollmentStatus.ACTIVE],
            ).exists()
            if existing:
                raise ValidationError("Already enrolled in this class.")

        enrollment = Enrollment(
            student=student,
            enrolled_class=enrolled_class,
            status=EnrollmentStatus.PENDING_PAYMENT,
        )
        enrollment.full_clean()
        enrollment.save()

        reference = f"ENROLL-{enrollment.id.hex[:8]}-{uuid.uuid4().hex[:12]}"

        amount = enrolled_class.sub_program.fee
        payment, checkout_url = initialize_online_payment(
            actor=None,
            enrollment=enrollment,
            amount=amount,
            reference=reference,
            callback_url=callback_url,
            return_url=return_url,
            customer={
                "email": student.user.email,
                "first_name": student.user.first_name,
                "last_name": student.user.last_name,
                "phone_number": student.user.phone_number or "",
            },
        )

    log_action(
        actor=student.user if user else None,
        action="enrollment.online_created",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrolled_class.branch,
    )

    return enrollment, checkout_url


def cancel_enrollment(actor, enrollment):
    if enrollment.status not in [
        EnrollmentStatus.PENDING_PAYMENT,
        EnrollmentStatus.ACTIVE,
    ]:
        raise ValidationError(
            f"Cannot cancel enrollment with status '{enrollment.status}'."
        )

    enrollment.status = EnrollmentStatus.CANCELLED
    enrollment.save()

    log_action(
        actor=actor,
        action="enrollment.cancelled",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return enrollment


def complete_enrollment(actor, enrollment):
    if enrollment.status != EnrollmentStatus.ACTIVE:
        raise ValidationError(
            f"Only active enrollments can be completed. Current status: '{enrollment.status}'."
        )

    enrollment.status = EnrollmentStatus.COMPLETED
    enrollment.save()

    log_action(
        actor=actor,
        action="enrollment.completed",
        resource_type="Enrollment",
        resource_id=enrollment.id,
        branch=enrollment.enrolled_class.branch,
    )

    return enrollment
