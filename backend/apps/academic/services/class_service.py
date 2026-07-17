from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from apps.academic.constants import ClassPeriod, ClassType
from apps.academic.models import Class


def get_class_or_404(pk):
    return get_object_or_404(Class.objects.select_related("sub_program", "branch", "instructor"), pk=pk)


def get_active_class_or_404(pk):
    klass = get_class_or_404(pk)
    if not klass.is_active:
        raise ValidationError("Target class is not active.")
    return klass


def list_classes():
    return Class.objects.select_related("sub_program", "branch", "instructor").all()


def create_class(
    *,
    sub_program,
    branch,
    instructor,
    name,
    class_type,
    class_period=ClassPeriod.FULL_DAY,
    capacity=None,
    start_date=None,
    end_date=None,
):
    if class_type == ClassType.INDIVIDUAL:
        capacity = 1

    klass = Class(
        sub_program=sub_program,
        branch=branch,
        instructor=instructor,
        name=name,
        class_type=class_type,
        class_period=class_period,
        capacity=capacity,
        start_date=start_date,
        end_date=end_date,
    )
    klass.full_clean()
    klass.save()
    return klass


def update_class(klass, **kwargs):
    for attr, value in kwargs.items():
        setattr(klass, attr, value)
    if klass.class_type == ClassType.INDIVIDUAL:
        klass.capacity = 1
    klass.full_clean()
    klass.save()
    return klass


def assign_instructor(klass, instructor):
    klass.instructor = instructor
    klass.full_clean()
    klass.save()
    return klass


def activate_class(klass):
    klass.is_active = True
    klass.save()
    return klass


def deactivate_class(klass):
    klass.is_active = False
    klass.save()
    return klass


def resolve_class_for_enrollment(*, sub_program_id, class_type, branch_id):
    """
    Resolve the active Class for a given sub-program, class type, and branch.

    Used by OnlineEnrollmentView when the frontend sends sub_program + class_type + branch
    instead of a direct enrolled_class UUID.

    Args:
        sub_program_id: UUID of the sub-program.
        class_type: ClassType value (GROUP or INDIVIDUAL).
        branch_id: UUID of the branch.

    Returns:
        Class instance or None if no active class matches.
    """
    return Class.objects.filter(
        sub_program_id=sub_program_id,
        class_type=class_type,
        branch_id=branch_id,
        is_active=True,
    ).select_related("sub_program__program", "branch").first()
