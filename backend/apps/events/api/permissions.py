from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import user_is_super_admin, user_is_branch_manager


class IsEventStaff(BasePermission):
    """
    Allow access only to Super Admin or Branch Manager.

    Branch Managers may only manage events within their assigned branches.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (user_is_super_admin(request.user) or user_is_branch_manager(request.user))
        )
