from collections import Counter

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.constants import ProgressStatus
from apps.academic.models import LearningMilestone, StudentProgress
from apps.shared.audit.services import log_action


def _validate_milestone_access(actor, milestone):
    from apps.accounts.permissions.roles import (
        user_is_branch_manager,
        user_is_instructor,
        user_is_super_admin,
    )

    if user_is_super_admin(actor) or user_is_branch_manager(actor):
        return

    if milestone.scope_class is None:
        raise DjangoValidationError(
            "Instructors cannot modify shared milestones. Use customize instead."
        )

    if not user_is_instructor(actor):
        raise DjangoValidationError("You do not have permission to modify this milestone.")

    if milestone.scope_class.instructor != actor:
        raise DjangoValidationError(
            "You are not the instructor for the class this milestone belongs to."
        )


def _validate_instructor_owns_class(actor, klass):
    from apps.accounts.permissions.roles import (
        user_is_branch_manager,
        user_is_super_admin,
    )

    if user_is_super_admin(actor) or user_is_branch_manager(actor):
        return
    if klass.instructor != actor:
        raise DjangoValidationError(
            "You are not assigned as the instructor for this class."
        )


def get_milestone_or_404(pk):
    return get_object_or_404(
        LearningMilestone.objects.select_related(
            "sub_program__program",
            "scope_class__branch",
            "scope_class__instructor",
        ),
        pk=pk,
    )


def list_milestones(sub_program=None, scope_class=None, include_inactive=False, branch_ids=None):
    qs = LearningMilestone.objects.select_related(
        "sub_program__program",
        "scope_class__branch",
        "scope_class__instructor",
    )
    if sub_program:
        qs = qs.filter(sub_program=sub_program)
    if scope_class:
        from django.db.models import Q
        qs = qs.filter(Q(scope_class=scope_class) | Q(scope_class__isnull=True))
    if branch_ids is not None:
        from django.db.models import Q
        qs = qs.filter(Q(scope_class__isnull=True) | Q(scope_class__branch_id__in=branch_ids))
    if not include_inactive:
        qs = qs.filter(is_active=True)
    return qs


def _validate_unique_milestone(sub_program, title, scope_class, exclude_id=None):
    qs = LearningMilestone.objects.filter(
        sub_program=sub_program, title=title,
    )
    if scope_class is not None:
        qs = qs.filter(scope_class=scope_class)
    else:
        qs = qs.filter(scope_class__isnull=True)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    if qs.exists():
        raise DjangoValidationError(
            f"A milestone with title '{title}' already exists in this scope."
        )


def create_milestone(actor, *, sub_program, title, description="", scope_class=None):
    from apps.accounts.permissions.roles import user_is_instructor

    if user_is_instructor(actor) and scope_class is None:
        raise DjangoValidationError(
            "Instructors cannot create shared milestones. They must be scoped to a class."
        )

    if scope_class is not None:
        _validate_instructor_owns_class(actor, scope_class)

    _validate_unique_milestone(sub_program, title, scope_class)

    milestone = LearningMilestone(
        sub_program=sub_program,
        scope_class=scope_class,
        title=title,
        description=description,
    )
    milestone.full_clean()
    milestone.save()

    log_action(
        actor=actor,
        action="LEARNING_MILESTONE_CREATED",
        resource_type="LearningMilestone",
        resource_id=str(milestone.id),
        branch=scope_class.branch if scope_class else None,
    )
    return milestone


def update_milestone(actor, milestone, *, title=None, description=None):
    _validate_milestone_access(actor, milestone)

    if title is not None:
        _validate_unique_milestone(
            milestone.sub_program, title, milestone.scope_class,
            exclude_id=milestone.pk,
        )
        milestone.title = title
    if description is not None:
        milestone.description = description
    milestone.full_clean()
    milestone.save()

    log_action(
        actor=actor,
        action="LEARNING_MILESTONE_UPDATED",
        resource_type="LearningMilestone",
        resource_id=str(milestone.id),
        branch=milestone.scope_class.branch if milestone.scope_class else None,
    )
    return milestone


def archive_milestone(actor, milestone):
    _validate_milestone_access(actor, milestone)

    milestone.is_active = False
    milestone.full_clean()
    milestone.save()

    log_action(
        actor=actor,
        action="LEARNING_MILESTONE_ARCHIVED",
        resource_type="LearningMilestone",
        resource_id=str(milestone.id),
        branch=milestone.scope_class.branch if milestone.scope_class else None,
    )
    return milestone


def customize_milestone(actor, source_milestone, target_class):
    _validate_instructor_owns_class(actor, target_class)

    if source_milestone.scope_class is not None:
        raise DjangoValidationError(
            "Can only customize shared milestones owned by the SubProgram."
        )

    customized = LearningMilestone(
        sub_program=source_milestone.sub_program,
        scope_class=target_class,
        title=source_milestone.title,
        description=source_milestone.description,
    )
    customized.full_clean()
    customized.save()

    log_action(
        actor=actor,
        action="LEARNING_MILESTONE_CUSTOMIZED",
        resource_type="LearningMilestone",
        resource_id=str(customized.id),
        branch=target_class.branch,
    )
    return customized


def _check_attendance_warning(enrollment):
    from apps.academic.constants import AttendanceStatus
    from apps.academic.models import AttendanceRecord

    total = AttendanceRecord.objects.filter(enrollment=enrollment).count()
    if total == 0:
        return "No attendance records found for this enrollment."
    present = AttendanceRecord.objects.filter(
        enrollment=enrollment, status=AttendanceStatus.PRESENT,
    ).count()
    rate = present / total
    threshold = 0.5
    if rate < threshold:
        return (
            f"Student attendance rate ({rate:.0%}) is below {threshold:.0%} "
            f"({present}/{total} sessions attended)."
        )
    return ""


def record_progress(actor, *, enrollment, milestone, status=ProgressStatus.NOT_STARTED, remarks=""):
    if milestone.sub_program != enrollment.enrolled_class.sub_program:
        raise DjangoValidationError(
            "Milestone must belong to the same SubProgram as the enrollment's class."
        )

    if milestone.scope_class is not None and milestone.scope_class != enrollment.enrolled_class:
        raise DjangoValidationError(
            "Milestone is scoped to a different class than the enrollment."
        )

    completed_at = None
    if status == ProgressStatus.COMPLETED:
        from django.utils import timezone
        completed_at = timezone.now()

    record, created = StudentProgress.objects.update_or_create(
        enrollment=enrollment,
        milestone=milestone,
        defaults={
            "status": status,
            "remarks": remarks,
            "completed_at": completed_at,
            "updated_by": actor,
        },
    )

    warnings = []
    if status == ProgressStatus.COMPLETED:
        warning = _check_attendance_warning(enrollment)
        if warning:
            warnings.append(warning)
            log_action(
                actor=actor,
                action="STUDENT_PROGRESS_COMPLETED_WITH_WARNINGS",
                resource_type="StudentProgress",
                resource_id=str(record.id),
                branch=enrollment.enrolled_class.branch,
                details={"warning": warning},
            )

    action = "STUDENT_PROGRESS_CREATED" if created else "STUDENT_PROGRESS_UPDATED"
    log_action(
        actor=actor,
        action=action,
        resource_type="StudentProgress",
        resource_id=str(record.id),
        branch=enrollment.enrolled_class.branch,
    )
    return record, warnings


def update_progress(actor, record, *, status=None, remarks=None):
    if status is not None:
        record.status = status
        if status == ProgressStatus.COMPLETED:
            from django.utils import timezone
            record.completed_at = timezone.now()
        elif status == ProgressStatus.NOT_STARTED:
            record.completed_at = None
    if remarks is not None:
        record.remarks = remarks
    record.updated_by = actor
    record.full_clean()
    record.save()

    warnings = []
    if status == ProgressStatus.COMPLETED:
        warning = _check_attendance_warning(record.enrollment)
        if warning:
            warnings.append(warning)
            log_action(
                actor=actor,
                action="STUDENT_PROGRESS_COMPLETED_WITH_WARNINGS",
                resource_type="StudentProgress",
                resource_id=str(record.id),
                branch=record.enrollment.enrolled_class.branch,
                details={"warning": warning},
            )

    log_action(
        actor=actor,
        action="STUDENT_PROGRESS_UPDATED",
        resource_type="StudentProgress",
        resource_id=str(record.id),
        branch=record.enrollment.enrolled_class.branch,
    )
    return record, warnings


def get_progress_history(enrollment):
    return StudentProgress.objects.filter(
        enrollment=enrollment,
        milestone__is_active=True,
    ).select_related(
        "milestone",
        "updated_by",
    ).order_by("milestone__title")


def get_progress_summary(enrollment):
    records = StudentProgress.objects.filter(
        enrollment=enrollment,
        milestone__is_active=True,
    )
    counts = Counter(records.values_list("status", flat=True))
    return {
        "not_started": counts.get(ProgressStatus.NOT_STARTED, 0),
        "in_progress": counts.get(ProgressStatus.IN_PROGRESS, 0),
        "completed": counts.get(ProgressStatus.COMPLETED, 0),
        "total": records.count(),
    }
