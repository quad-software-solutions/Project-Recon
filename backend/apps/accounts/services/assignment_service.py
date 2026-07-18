"""
Branch-role assignment service.
"""

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.accounts.models import UserAssignment
from apps.accounts.constants import Roles, BranchStatus
from apps.shared.audit.services import log_action


def _ensure_branch_allows_assignment(branch) -> None:
    """Raise when assignments are not allowed on the given branch."""
    if branch and branch.status == BranchStatus.ARCHIVED:
        raise ValidationError("Cannot assign users to an archived branch.")


def _clear_primary_for_user(user, actor=None) -> None:
    """Unset the current primary assignment for a user."""
    UserAssignment.objects.filter(user=user, is_primary=True).update(is_primary=False)
    log_action(actor, "PRIMARY_UNSET", "User", user.id)


def assign_role(user, role, branch, assigned_by=None, is_primary=False):
    """
    Create or reactivate a role assignment for a user at a branch.

    Args:
        user: User receiving the assignment.
        role: Role constant from ``Roles``.
        branch: Branch instance, or None for Super Admin.
        assigned_by: Administrator performing the action.
        is_primary: Whether this assignment becomes the user's primary context.

    Returns:
        UserAssignment instance.

    Raises:
        ValidationError: Invalid role/branch combination, duplicate, or archived branch.
    """
    if role == Roles.SUPER_ADMIN and branch is not None:
        raise ValidationError("Super Admin cannot be assigned to a branch.")
    if role != Roles.SUPER_ADMIN and branch is None:
        raise ValidationError("Non-Super Admin must be assigned to a branch.")

    _ensure_branch_allows_assignment(branch)

    with transaction.atomic():
        if is_primary:
            _clear_primary_for_user(user, assigned_by)

        if role == Roles.BRANCH_MANAGER:
            existing_managers = UserAssignment.objects.filter(
                branch=branch,
                role=Roles.BRANCH_MANAGER,
                is_active=True,
            ).exclude(user=user)

            if existing_managers.exists():
                raise ValidationError(
                    "Branch manager already exists for this branch."
                )

        existing_assignment = UserAssignment.objects.select_for_update().filter(
            user=user, branch=branch, role=role
        ).first()

        if existing_assignment:
            if existing_assignment.is_active:
                raise ValidationError(
                    "User already has this active role at this branch."
                )
            existing_assignment.is_active = True
            existing_assignment.is_primary = is_primary
            existing_assignment.assigned_by = assigned_by
            existing_assignment.save(
                update_fields=["is_active", "is_primary", "assigned_by"]
            )
            
            log_action(assigned_by, "ASSIGNMENT_REACTIVATED", "UserAssignment", existing_assignment.id, branch=existing_assignment.branch)
            
            return existing_assignment

        assignment = UserAssignment.objects.create(
            user=user,
            branch=branch,
            role=role,
            is_primary=is_primary,
            assigned_by=assigned_by,
        )
        log_action(assigned_by, "ASSIGNMENT_CREATED", "UserAssignment", assignment.id, branch=assignment.branch)
        
        return assignment


def remove_assignment(assignment, actor=None) -> None:
    """Deactivate an assignment without deleting the row."""
    assignment.is_active = False
    assignment.is_primary = False
    assignment.save(update_fields=["is_active", "is_primary"])
    log_action(actor, "ASSIGNMENT_REMOVED", "UserAssignment", assignment.id, branch=assignment.branch)


def update_assignment(assignment, actor=None, **fields):
    """
    Update mutable fields on an assignment.

    Args:
        assignment: UserAssignment to update.
        actor: Optional actor for audit logging.
        **fields: Supported keys: ``is_primary``, ``is_active``.

    Returns:
        Updated UserAssignment instance.

    Raises:
        ValidationError: Primary assignment must remain active, or branch is archived.
    """
    updates = {}
    if "is_active" in fields:
        updates["is_active"] = fields["is_active"]
    if "is_primary" in fields:
        updates["is_primary"] = fields["is_primary"]

    if updates.get("is_primary") and updates.get("is_active") is False:
        raise ValidationError("Primary assignment must be active.")
    if updates.get("is_primary") and assignment.is_active is False and "is_active" not in fields:
        raise ValidationError("Primary assignment must be active.")

    if updates.get("is_active") is True or (
        "is_active" not in fields and assignment.is_active
    ):
        _ensure_branch_allows_assignment(assignment.branch)

    with transaction.atomic():
        if updates.get("is_primary"):
            _clear_primary_for_user(assignment.user, actor)

        for key, value in updates.items():
            setattr(assignment, key, value)
        assignment.save(update_fields=list(updates.keys()))
        
        log_action(actor, "ASSIGNMENT_UPDATED", "UserAssignment", assignment.id, branch=assignment.branch)
    
    return assignment


def change_primary_assignment(user, new_assignment, actor=None) -> None:
    """
    Set a new primary assignment for a user.

    Raises:
        ValidationError: Assignment is inactive.
    """
    if not new_assignment.is_active:
        raise ValidationError("Primary assignment must be active.")

    with transaction.atomic():
        _clear_primary_for_user(user, actor)
        new_assignment.is_primary = True
        new_assignment.save(update_fields=["is_primary"])
        log_action(actor, "ASSIGNMENT_PRIMARY_CHANGED", "UserAssignment", new_assignment.id, branch=new_assignment.branch)


def transfer_user(user, from_branch, to_branch, role, actor=None):
    """
    Move a user's role from one branch to another.

    Returns:
        New UserAssignment at the destination branch.
    """
    with transaction.atomic():
        old_assignment = UserAssignment.objects.filter(
            user=user, branch=from_branch, role=role, is_active=True
        ).first()

        if old_assignment:
            remove_assignment(old_assignment, actor)

        log_action(actor, "USER_TRANSFERRED", "User", user.id, details={"from_branch_id": str(from_branch.id), "to_branch_id": str(to_branch.id)})
        return assign_role(user, role, to_branch, assigned_by=actor)


def list_assignments(user=None, branch=None, role=None, active_only=True):
    """
    List assignments with optional filters.

    Returns:
        QuerySet of UserAssignment rows.
    """
    qs = UserAssignment.objects.select_related("user", "branch", "assigned_by")
    if user is not None:
        qs = qs.filter(user=user)
    if branch is not None:
        qs = qs.filter(branch=branch)
    if role is not None:
        qs = qs.filter(role=role)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by("-created_at")
