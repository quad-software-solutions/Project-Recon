from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import user_is_super_admin


class IsStoreStaff(BasePermission):
    """Allow only authenticated Super Admin access to Store admin endpoints."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and user_is_super_admin(request.user)
        )
