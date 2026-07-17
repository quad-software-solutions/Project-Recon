from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.academic.models import Student
from apps.accounts.services.user_service import (
    update_user,

)
from apps.shared.audit.services import log_action


def get_student_or_404(pk):
    return get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=pk
    )


def get_student_profile(pk):
    return get_student_or_404(pk)


def update_student(student, actor=None, **kwargs):
    user_updates = {}
    student_updates = {}

    user_fields = {"first_name", "last_name", "phone_number", "email"}
    for key, value in kwargs.items():
        if key in user_fields:
            user_updates[key] = value
        else:
            student_updates[key] = value

    with transaction.atomic():
        if user_updates:
            update_user(student.user, actor=actor, **user_updates)

        for attr, value in student_updates.items():
            setattr(student, attr, value)

        if student_updates:
            student.full_clean()
            student.save()

    log_action(
        actor=actor,
        action="student.updated",
        resource_type="Student",
        resource_id=student.id,
        branch=student.branch,
    )

    return student


def list_students(branch_ids=None):
    qs = Student.objects.select_related("user", "branch")
    if branch_ids:
        qs = qs.filter(branch_id__in=branch_ids)
    return qs.all()


def search_students(query, branch_ids=None):
    qs = Student.objects.select_related("user", "branch").filter(
        Q(user__first_name__icontains=query)
        | Q(user__last_name__icontains=query)
        | Q(user__email__icontains=query)
        | Q(user__phone_number__icontains=query)
    )
    if branch_ids:
        qs = qs.filter(branch_id__in=branch_ids)
    return qs


def activate_student(student, actor=None):
    student.is_active = True
    student.save()
    log_action(
        actor=actor,
        action="student.activated",
        resource_type="Student",
        resource_id=student.id,
        branch=student.branch,
    )
    return student


def deactivate_student(student, actor=None):
    student.is_active = False
    student.save()
    log_action(
        actor=actor,
        action="student.deactivated",
        resource_type="Student",
        resource_id=student.id,
        branch=student.branch,
    )
    return student
