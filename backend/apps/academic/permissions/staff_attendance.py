from rest_framework.permissions import BasePermission

from apps.accounts.permissions.roles import (
    user_is_branch_manager,
    user_is_super_admin,
    user_manages_branch,
)


class IsAttendanceManager(BasePermission):
    """
    Grants access to Super Admins and Branch Managers.

    Branch Manager access is scoped to their assigned branch.
    The view must provide a ``branch`` attribute on the request
    or define ``get_branch_id()``.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_is_super_admin(user):
            return True
        

        if not user_is_branch_manager(user):
            return False
        branch_id = view.get_branch_id(request)
        if branch_id is None:
            return False
        return user_manages_branch(user, branch_id)
