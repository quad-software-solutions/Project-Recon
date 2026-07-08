from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.academic.constants import SessionStatus
from apps.academic.models import StaffAttendanceSession, StaffAttendanceRecord
from apps.accounts.constants import Roles
from apps.shared.audit.services import log_action

def create_session(*, branch, date, created_by, notes=""):
    session = StaffAttendanceSession(
        branch=branch,
        date=date,
        status=SessionStatus.DRAFT,
        notes=notes,
        created_by=created_by,
    )
    session.full_clean()
    session.save()
    log_action(
        actor=created_by,
        action="STAFF_ATTENDANCE_SESSION_CREATED",
        resource_type="StaffAttendanceSession",
        resource_id=session.id,
        branch=branch,
    )
    return session


def get_session_or_404(pk):
    return get_object_or_404(
        StaffAttendanceSession.objects.filter(is_active=True)
        .select_related("branch", "created_by"),
        pk=pk,
    )


def list_sessions(branch=None, date_from=None, date_to=None, status=None):
    qs = StaffAttendanceSession.objects.filter(is_active=True).select_related(
        "branch", "created_by"
    )
    if branch:
        qs = qs.filter(branch=branch)
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    if status:
        qs = qs.filter(status=status)
    return qs


def update_session(actor, session, **kwargs):
    if session.status != SessionStatus.DRAFT:
        raise DjangoValidationError("Cannot modify a published session.")
    for attr, value in kwargs.items():
        setattr(session, attr, value)
    session.full_clean()
    session.save()
    log_action(
        actor=actor,
        action="STAFF_ATTENDANCE_SESSION_UPDATED",
        resource_type="StaffAttendanceSession",
        resource_id=session.id,
        branch=session.branch,
    )
    return session


def publish_session(actor, session):
    if session.status != SessionStatus.DRAFT:
        raise DjangoValidationError("Session is already published.")
    session.status = SessionStatus.PUBLISHED
    session.save()
    log_action(
        actor=actor,
        action="STAFF_ATTENDANCE_SESSION_PUBLISHED",
        resource_type="StaffAttendanceSession",
        resource_id=session.id,
        branch=session.branch,
    )
    return session


def soft_delete_session(actor, session):
    session.is_active = False
    session.save()
    log_action(
        actor=actor,
        action="STAFF_ATTENDANCE_SESSION_SOFT_DELETED",
        resource_type="StaffAttendanceSession",
        resource_id=session.id,
        branch=session.branch,
    )
    return session


def upsert_records(actor, session, records_data):
    if session.status != SessionStatus.DRAFT:
        raise DjangoValidationError("Cannot modify records in a published session.")

    from apps.accounts.models import User

    with transaction.atomic():
        created = []
        for item in records_data:
            staff_member = item["staff_member"]
            if not isinstance(staff_member, User):
                staff_member = User.objects.get(pk=staff_member)
            record, _ = StaffAttendanceRecord.objects.update_or_create(
                session=session,
                staff_member=staff_member,
                defaults={"status": item["status"], "notes": item.get("notes", "")},
            )
            created.append(record)
        log_action(
            actor=actor,
            action="STAFF_ATTENDANCE_RECORDS_UPSERTED",
            resource_type="StaffAttendanceSession",
            resource_id=session.id,
            branch=session.branch,
        )
        return created


def get_record_or_404(pk):
    return get_object_or_404(
        StaffAttendanceRecord.objects.select_related("session", "staff_member"), pk=pk
    )


def update_record(actor, record, **kwargs):
    if record.session.status != SessionStatus.DRAFT:
        raise DjangoValidationError("Cannot modify records in a published session.")
    for attr, value in kwargs.items():
        setattr(record, attr, value)
    record.full_clean()
    record.save()
    log_action(
        actor=actor,
        action="STAFF_ATTENDANCE_RECORD_UPDATED",
        resource_type="StaffAttendanceRecord",
        resource_id=record.id,
        branch=record.session.branch,
    )
    return record


def delete_record(actor, record):
    if record.session.status != SessionStatus.DRAFT:
        raise DjangoValidationError("Cannot modify records in a published session.")
    log_action(
        actor=actor,
        action="STAFF_ATTENDANCE_RECORD_DELETED",
        resource_type="StaffAttendanceRecord",
        resource_id=record.id,
        branch=record.session.branch,
    )
    record.delete()


def list_available_staff(branch):
    from apps.accounts.models import UserAssignment
    from apps.accounts.constants import AccountStatus

    staff_ids = (
        UserAssignment.objects.filter(
            branch=branch,
            is_active=True,
        )
        .exclude(role=Roles.STUDENT)
        .exclude(role=Roles.SUPER_ADMIN)
        .values_list("user_id", flat=True)
        .distinct()
    )
    from apps.accounts.models import User

    return User.objects.filter(id__in=staff_ids, status=AccountStatus.ACTIVE)


def get_session_records(session):
    return session.records.select_related("staff_member").all()
