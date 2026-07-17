"""Accounts module DRF permission classes."""

from rest_framework.permissions import BasePermission

from apps.accounts.constants import Roles
from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    get_active_roles,
    user_is_branch_manager,
    user_is_instructor,
    user_is_secretary,
    user_is_super_admin,
    user_manages_branch,
)


class IsSuperAdmin(BasePermission):
    """Allow only users with an active Super Admin assignment."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and user_is_super_admin(request.user)


class IsBranchManager(BasePermission):
    """Allow only users with an active Branch Manager assignment."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and user_is_branch_manager(request.user)


class IsInstructor(BasePermission):
    """Allow only users with an active Instructor assignment."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and user_is_instructor(request.user)


class IsSuperAdminOrBranchManager(BasePermission):
    """Allow Super Admin or any active Branch Manager."""

    def has_permission(self, request, view) -> bool:
        if not request.user.is_authenticated:
            return False
        roles = get_active_roles(request.user)
        return Roles.SUPER_ADMIN in roles or Roles.BRANCH_MANAGER in roles


class IsSecretary(BasePermission):
    """Allow only users with an active Secretary assignment."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and user_is_secretary(request.user)


class IsSelfOrSuperAdmin(BasePermission):
    """Allow the resource owner or a Super Admin."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj) -> bool:
        if user_is_super_admin(request.user):
            return True
        target_user = getattr(obj, "user", obj)
        return target_user == request.user


__all__ = [
    "IsSuperAdmin",
    "IsBranchManager",
    "IsInstructor",
    "IsSecretary",
    "IsSuperAdminOrBranchManager",
    "IsSelfOrSuperAdmin",
    "get_active_branch_ids",
    "get_active_roles",
    "user_is_super_admin",
    "user_is_branch_manager",
    "user_is_secretary",
    "user_manages_branch",
    "Roles",
]
