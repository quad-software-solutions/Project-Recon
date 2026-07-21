from uuid import UUID as _UUID

from rest_framework.exceptions import PermissionDenied

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
    user_is_super_admin,
)


def check_branch_access(user, branch_id):
    """Raise PermissionDenied if user cannot access the given branch.

    Super admins have unrestricted access. Branch managers and secretaries
    are scoped to their assigned branches.

    Args:
        user: Authenticated User instance.
        branch_id: Branch UUID (str or UUID).

    Raises:
        PermissionDenied: If user lacks access to the branch.
    """
    if user_is_super_admin(user):
        return
    if not user_is_branch_manager(user) and not user_is_secretary(user):
        raise PermissionDenied("You do not have access to this branch.")
    if isinstance(branch_id, str):
        branch_id = _UUID(branch_id)
    if branch_id not in get_active_branch_ids(user):
        raise PermissionDenied("You do not have access to this branch.")


def check_enrollment_branch_access(user, enrollment):
    """Raise PermissionDenied if user cannot access the enrollment's branch.

    Convenience wrapper for Enrollment objects where branch is accessed
    through enrolled_class.branch_id.

    Args:
        user: Authenticated User instance.
        enrollment: Enrollment instance with enrolled_class__branch relation.

    Raises:
        PermissionDenied: If user lacks access to the enrollment's branch.
    """
    check_branch_access(user, enrollment.enrolled_class.branch_id)
