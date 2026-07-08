from collections import Counter

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.constants import AttendanceStatus, EnrollmentStatus
from apps.academic.models import AttendanceSession, AttendanceRecord
from apps.shared.audit.services import log_action


def _validate_instructor_for_class(actor, enrolled_class):
    from apps.accounts.permissions.roles import user_is_super_admin, user_is_branch_manager

    if user_is_super_admin(actor) or user_is_branch_manager(actor):
        return
    if enrolled_class.instructor != actor:
        raise DjangoValidationError(
            "You are not assigned as the instructor for this class."
        )


def create_session(actor, *, enrolled_class, session_date, topic=""):
    _validate_instructor_for_class(actor, enrolled_class)

    session = AttendanceSession(
        enrolled_class=enrolled_class,
        session_date=session_date,
        topic=topic,
        recorded_by=actor,
    )
    session.full_clean()
    session.save()

    log_action(
        actor=actor,
        action="ATTENDANCE_SESSION_CREATED",
        resource_type="AttendanceSession",
        resource_id=str(session.id),
        branch=enrolled_class.branch,
    )
    return session


def get_session_or_404(pk):
    return get_object_or_404(
        AttendanceSession.objects.select_related(
            "enrolled_class__sub_program__program",
            "enrolled_class__branch",
            "recorded_by",
        ),
        pk=pk,
    )


def list_sessions(enrolled_class=None, date_from=None, date_to=None):
    qs = AttendanceSession.objects.select_related(
        "enrolled_class__sub_program__program",
        "enrolled_class__branch",
        "recorded_by",
    )
    if enrolled_class:
        qs = qs.filter(enrolled_class=enrolled_class)
    if date_from:
        qs = qs.filter(session_date__gte=date_from)
    if date_to:
        qs = qs.filter(session_date__lte=date_to)
    return qs


def update_session(actor, session, *, session_date=None, topic=None):
    _validate_instructor_for_class(actor, session.enrolled_class)

    if session_date is not None:
        session.session_date = session_date
    if topic is not None:
        session.topic = topic
    session.full_clean()
    session.save()

    log_action(
        actor=actor,
        action="ATTENDANCE_SESSION_UPDATED",
        resource_type="AttendanceSession",
        resource_id=str(session.id),
        branch=session.enrolled_class.branch,
    )
    return session


def record_attendance(actor, *, session, enrollment, status, remarks=""):
    _validate_instructor_for_class(actor, session.enrolled_class)

    if enrollment.enrolled_class != session.enrolled_class:
        raise DjangoValidationError(
            "Enrollment does not belong to the session's class."
        )

    if enrollment.status != EnrollmentStatus.ACTIVE:
        raise DjangoValidationError(
            "Attendance can only be recorded for active enrollments."
        )

    record, created = AttendanceRecord.objects.update_or_create(
        attendance_session=session,
        enrollment=enrollment,
        defaults={"status": status, "remarks": remarks},
    )

    action = "ATTENDANCE_RECORD_CREATED" if created else "ATTENDANCE_RECORD_UPDATED"
    log_action(
        actor=actor,
        action=action,
        resource_type="AttendanceRecord",
        resource_id=str(record.id),
        branch=session.enrolled_class.branch,
    )
    return record


def bulk_record_attendance(actor, *, session, records):
    _validate_instructor_for_class(actor, session.enrolled_class)

    from apps.academic.models import Enrollment

    result = []
    with transaction.atomic():
        for item in records:
            enrollment = item["enrollment"]
            if not isinstance(enrollment, Enrollment):
                enrollment = Enrollment.objects.select_related(
                    "enrolled_class"
                ).get(pk=enrollment)

            if enrollment.enrolled_class != session.enrolled_class:
                raise DjangoValidationError(
                    f"Enrollment {enrollment.id} does not belong to the session's class."
                )

            if enrollment.status != EnrollmentStatus.ACTIVE:
                raise DjangoValidationError(
                    f"Enrollment {enrollment.id} is not active."
                )

            record, _ = AttendanceRecord.objects.update_or_create(
                attendance_session=session,
                enrollment=enrollment,
                defaults={
                    "status": item["status"],
                    "remarks": item.get("remarks", ""),
                },
            )
            result.append(record)

    log_action(
        actor=actor,
        action="ATTENDANCE_RECORDS_BULK_UPDATED",
        resource_type="AttendanceSession",
        resource_id=str(session.id),
        branch=session.enrolled_class.branch,
    )
    return result


def update_attendance_record(actor, record, *, status=None, remarks=None):
    _validate_instructor_for_class(actor, record.attendance_session.enrolled_class)

    if status is not None:
        record.status = status
    if remarks is not None:
        record.remarks = remarks
    record.full_clean()
    record.save()

    log_action(
        actor=actor,
        action="ATTENDANCE_RECORD_UPDATED",
        resource_type="AttendanceRecord",
        resource_id=str(record.id),
        branch=record.attendance_session.enrolled_class.branch,
    )
    return record


def get_enrollment_attendance_history(enrollment):
    return AttendanceRecord.objects.filter(enrollment=enrollment).select_related(
        "attendance_session"
    ).order_by("-attendance_session__session_date", "-attendance_session__created_at")


def get_attendance_summary(enrollment):
    records = AttendanceRecord.objects.filter(enrollment=enrollment)
    counts = Counter(records.values_list("status", flat=True))
    return {
        "present": counts.get(AttendanceStatus.PRESENT, 0),
        "absent": counts.get(AttendanceStatus.ABSENT, 0),
        "late": counts.get(AttendanceStatus.LATE, 0),
        "excused": counts.get(AttendanceStatus.EXCUSED, 0),
        "total": records.count(),
    }
