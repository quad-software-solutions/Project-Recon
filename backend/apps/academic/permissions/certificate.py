from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
    user_is_student,
    user_is_super_admin,
)
from rest_framework.permissions import BasePermission


class CanManageCertificate(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            user_is_super_admin(user)
            or user_is_branch_manager(user)
            or user_is_secretary(user)
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user):
            from apps.academic.models import Class
            branch_ids = get_active_branch_ids(user)
            return Class.objects.filter(
                sub_program=getattr(obj, "sub_program", obj),
                branch_id__in=branch_ids,
            ).exists()
        return False


class CanViewCertificate(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            user_is_super_admin(user)
            or user_is_branch_manager(user)
            or user_is_secretary(user)
            or user_is_student(user)
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_secretary(user):
            from apps.academic.models import Class
            branch_ids = get_active_branch_ids(user)
            return Class.objects.filter(
                sub_program=getattr(obj, "sub_program", obj),
                branch_id__in=branch_ids,
            ).exists()
        if user_is_student(user):
            from apps.academic.models import Student
            try:
                student = Student.objects.get(user=user)
            except Student.DoesNotExist:
                return False
            return obj.student == student
        return False
