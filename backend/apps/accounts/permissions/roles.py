"""
Role and branch-scope helpers derived from active UserAssignment records.
"""

from apps.accounts.constants import Roles


def get_active_roles(user) -> set[str]:
    """
    Return the set of active role strings for a user.
    Results are cached on the user instance for the request lifecycle.

    Args:
        user: Authenticated User instance.

    Returns:
        Set of role choice values.
    """
    if not user or not user.is_authenticated:
        return set()
    if hasattr(user, '_cached_roles'):
        return user._cached_roles
    roles = set(
        user.assignments.filter(is_active=True).values_list("role", flat=True)
    )
    user._cached_roles = roles
    return roles


def get_active_branch_ids(user) -> set:
    """
    Return branch UUIDs where the user has an active assignment.
    Results are cached on the user instance for the request lifecycle.

    Args:
        user: Authenticated User instance.

    Returns:
        Set of branch primary keys.
    """
    if not user or not user.is_authenticated:
        return set()
    if hasattr(user, '_cached_branch_ids'):
        return user._cached_branch_ids
    branch_ids = set(
        user.assignments.filter(is_active=True, branch__isnull=False).values_list(
            "branch_id", flat=True
        )
    )
    user._cached_branch_ids = branch_ids
    return branch_ids


def user_is_super_admin(user) -> bool:
    """Return True when the user has an active Super Admin assignment."""
    return Roles.SUPER_ADMIN in get_active_roles(user)


def user_is_branch_manager(user) -> bool:
    """Return True when the user has an active Branch Manager assignment."""
    return Roles.BRANCH_MANAGER in get_active_roles(user)


def user_is_instructor(user) -> bool:
    """Return True when the user has an active Instructor assignment."""
    return Roles.INSTRUCTOR in get_active_roles(user)


def user_is_secretary(user) -> bool:
    """Return True when the user has an active Secretary assignment."""
    return Roles.SECRETARY in get_active_roles(user)


def user_is_student(user) -> bool:
    """Return True when the user has an active Student assignment."""
    return Roles.STUDENT in get_active_roles(user)


def user_manages_branch(user, branch_id) -> bool:
    """
    Return True when the user is Super Admin or manages the given branch.

    Args:
        user: Authenticated User instance.
        branch_id: Branch UUID (str or UUID).

    Returns:
        True if the user may administer the branch.
    """
    if user_is_super_admin(user):
        return True
    if not user_is_branch_manager(user):
        return False
    if isinstance(branch_id, str):
        from uuid import UUID
        branch_id = UUID(branch_id)
    return branch_id in get_active_branch_ids(user)
