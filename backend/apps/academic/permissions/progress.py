from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
    user_is_branch_manager,
    user_is_instructor,
    user_is_super_admin,
    user_manages_branch,
)


class CanManageProgress(BasePermission):
    """
    Grants access to Super Admins, Branch Managers, and Instructors.
    - Super Admin: unrestricted.
    - Branch Manager: scoped to their branch.
    - Instructor: scoped to classes they teach.
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

        branch = None
        if hasattr(obj, "scope_class") and obj.scope_class:
            branch = obj.scope_class.branch
        elif hasattr(obj, "milestone"):
            milestone = obj.milestone
            if milestone.scope_class:
                branch = milestone.scope_class.branch
            elif hasattr(milestone, "sub_program"):
                from apps.academic.models import Class
                klass = Class.objects.filter(
                    sub_program=milestone.sub_program
                ).first()
                if klass:
                    branch = klass.branch
        elif hasattr(obj, "enrollment"):
            branch = obj.enrollment.enrolled_class.branch

        if branch and user_is_branch_manager(user) and user_manages_branch(user, branch.pk):
            return True

        if user_is_instructor(user):
            if hasattr(obj, "scope_class") and obj.scope_class:
                return obj.scope_class.instructor == user
            if hasattr(obj, "milestone") and obj.milestone.scope_class:
                return obj.milestone.scope_class.instructor == user
            if hasattr(obj, "enrollment"):
                return obj.enrollment.enrolled_class.instructor == user

        return False
