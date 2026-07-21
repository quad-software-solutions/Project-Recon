from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.permissions.roles import (
    user_is_branch_manager,
    user_is_instructor,
    user_is_secretary,
    user_is_super_admin,
    user_manages_branch,
)


class CanManageAttendance(BasePermission):
    """
    - Super Admin: unrestricted.
    - Instructor: CRUD on own classes.
    - Branch Manager / Secretary: read-only (GET), branch scoped.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_is_super_admin(user):
            return True
        if user_is_instructor(user):
            return True
        if request.method in SAFE_METHODS and (user_is_branch_manager(user) or user_is_secretary(user)):
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True

        enrolled_class = getattr(obj, "enrolled_class", None)
        if enrolled_class is None and hasattr(obj, "attendance_session"):
            enrolled_class = obj.attendance_session.enrolled_class

        if enrolled_class:
            branch = enrolled_class.branch
            if request.method in SAFE_METHODS and (user_is_branch_manager(user) or user_is_secretary(user)):
                return user_manages_branch(user, branch.pk)
            if user_is_instructor(user) and enrolled_class.instructor == user:
                return True

        return False
