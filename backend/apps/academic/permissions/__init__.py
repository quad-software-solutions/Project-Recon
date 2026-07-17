from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_super_admin,
    user_is_branch_manager,
    user_is_secretary,
)

from apps.academic.permissions.academic_report import CanViewReport, CanViewStaffReport


class IsAcademicAdmin(BasePermission):
    """
    Grants access to Super Admins and Branch Managers.

    Branch Manager access is scoped to their assigned branch.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user_is_super_admin(user) or user_is_branch_manager(user)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user_is_super_admin(user):
            return True
        branch_ids = get_active_branch_ids(user)
        branch_id = getattr(obj, 'branch_id', None)
        if branch_id is not None:
            return branch_id in branch_ids
        branch = getattr(obj, 'branch', None)
        if branch is not None:
            return branch.id in branch_ids
        return True


class IsAcademicStaff(BasePermission):
    """
    Grants access to Super Admins, Branch Managers, and Secretaries.
    """

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
        branch_ids = get_active_branch_ids(user)
        branch_id = getattr(obj, 'branch_id', None)
        if branch_id is not None:
            return branch_id in branch_ids
        branch = getattr(obj, 'branch', None)
        if branch is not None:
            return branch.id in branch_ids
        return True
