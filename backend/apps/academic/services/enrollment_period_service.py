from django.shortcuts import get_object_or_404

from apps.academic.models import EnrollmentPeriod
from apps.shared.audit.services import log_action


def get_enrollment_period_or_404(pk):
    return get_object_or_404(
        EnrollmentPeriod.objects.select_related("branch", "program", "sub_program"),
        pk=pk,
    )


def list_enrollment_periods():
    return EnrollmentPeriod.objects.select_related("branch", "program", "sub_program").all()


def create_enrollment_period(
    actor,
    *,
    branch,
    program,
    sub_program,
    class_type,
    class_period,
    title,
    start_date,
    end_date,
):
    period = EnrollmentPeriod(
        branch=branch,
        program=program,
        sub_program=sub_program,
        class_type=class_type,
        class_period=class_period,
        title=title,
        start_date=start_date,
        end_date=end_date,
    )
    period.full_clean()
    period.save()
    log_action(
        actor=actor,
        action="enrollment_period.created",
        resource_type="EnrollmentPeriod",
        resource_id=period.id,
        branch=branch,
    )

    return period


def update_enrollment_period(actor, period, **kwargs):
    for attr, value in kwargs.items():
        setattr(period, attr, value)
    period.full_clean()
    period.save()
    log_action(
        actor=actor,
        action="enrollment_period.updated",
        resource_type="EnrollmentPeriod",
        resource_id=period.id,
        branch=period.branch,
    )
    return period


def activate_enrollment_period(actor, period):
    period.is_active = True
    period.save()
    log_action(
        actor=actor,
        action="enrollment_period.activated",
        resource_type="EnrollmentPeriod",
        resource_id=period.id,
        branch=period.branch,
    )
    return period


def deactivate_enrollment_period(actor, period):
    period.is_active = False
    period.save()
    log_action(
        actor=actor,
        action="enrollment_period.deactivated",
        resource_type="EnrollmentPeriod",
        resource_id=period.id,
        branch=period.branch,
    )
    return period
