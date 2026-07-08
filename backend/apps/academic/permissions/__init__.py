from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
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
