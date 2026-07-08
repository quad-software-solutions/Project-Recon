from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_instructor,
    user_is_student,
    user_is_super_admin,
)


class CanManageMaterial(BasePermission):
    """
    Grants create/update/delete access to Super Admins, Branch Managers,
    and Instructors (for their own materials).

    - Super Admin: unrestricted.
    - Branch Manager: scoped to their branch.
    - Instructor: restricted to own uploaded materials (object-level).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_instructor(user):
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True

        if user_is_branch_manager(user):
            from apps.academic.models import Class
            branch_ids = get_active_branch_ids(user)
            return Class.objects.filter(
                sub_program=obj.sub_program,
                branch_id__in=branch_ids,
            ).exists()

        if user_is_instructor(user) and obj.uploaded_by == user:
            return True

        return False


class CanViewMaterial(BasePermission):
    """
    Grants view/download access to Super Admins, Branch Managers,
    Instructors, and Students (only enrolled SubPrograms).

    Student access is enforced at the query level in the view/service.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_instructor(user) or user_is_student(user):
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_instructor(user):
            return True
        if user_is_student(user):
            from apps.academic.models import Student, Enrollment
            try:
                student = Student.objects.get(user=user)
            except Student.DoesNotExist:
                return False
            return Enrollment.objects.filter(
                student=student,
                enrolled_class__sub_program=obj.sub_program,
                status__in=["ACTIVE", "COMPLETED"],
            ).exists()
        return False
