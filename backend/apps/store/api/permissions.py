from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_super_admin,
)


class IsStoreStaff(BasePermission):
    """Allow only authenticated Super Admin access to Store admin endpoints."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and user_is_super_admin(request.user)
        )


class IsStoreInventoryStaff(BasePermission):
    """
    Allow access to Super Admin (unrestricted) or Branch Manager (branch-scoped).

    Branch Managers may only access inventory records belonging to their
    assigned branches.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                user_is_super_admin(request.user)
                or user_is_branch_manager(request.user)
            )
        )

    def has_object_permission(self, request, view, obj):
        if user_is_super_admin(request.user):
            return True
        if user_is_branch_manager(request.user):
            return obj.branch_id in get_active_branch_ids(request.user)
        return False


class IsStoreStaffOrManager(BasePermission):
    """
    Allow Super Admin (unrestricted) or Branch Manager (branch-scoped).

    Branch Manager access is scoped at the view level via get_queryset
    or explicit object-level checks.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                user_is_super_admin(request.user)
                or user_is_branch_manager(request.user)
            )
        )
