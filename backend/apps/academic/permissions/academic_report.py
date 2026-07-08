from uuid import UUID

from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_instructor,
    user_is_secretary,
    user_is_student,
    user_is_super_admin,
)


def _user_manages_or_works_in_branch(user, branch_id) -> bool:
    """Check if user is Super Admin, manages, or works in the given branch."""
    if user_is_super_admin(user):
        return True
    if not (user_is_branch_manager(user) or user_is_secretary(user)):
        return False
    if isinstance(branch_id, str):
        branch_id = UUID(branch_id)
    return branch_id in get_active_branch_ids(user)


class CanViewReport(BasePermission):
    """
    Grants access to student-level reports.

    - Super Admin: any student
    - Branch Manager / Secretary: students in own branch
    - Student: own reports only
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_secretary(user):
            return _user_manages_or_works_in_branch(user, obj.branch_id)
        if user_is_student(user):
            return getattr(obj, "user", None) == user
        return False


class CanViewStaffReport(BasePermission):
    """
    Grants access to staff-level reports (class, subprogram, program).

    - Super Admin: unrestricted
    - Branch Manager / Secretary: resources in own branch (where applicable)
    - Instructor: own classes only
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_id = getattr(obj, "branch_id", None)
            if branch_id:
                return _user_manages_or_works_in_branch(user, branch_id)
            return True
        if user_is_instructor(user):
            instructor = getattr(obj, "instructor", None)
            if instructor:
                return instructor == user
            return False
        return False
