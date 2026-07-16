from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.permissions.roles import user_is_super_admin


class BankAccountPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and user_is_super_admin(request.user)
        )
