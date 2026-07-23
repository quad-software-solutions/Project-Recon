"""
Branch management service.
"""

from django.db import transaction, IntegrityError
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import Branch, UserAssignment
from apps.accounts.constants import Roles, BranchStatus
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin
from apps.accounts.services import assignment_service
from apps.shared.audit.services import log_action


def create_branch(branch_fields: dict, actor=None) -> Branch:
    """
    Create a new branch.

    Returns:
        Created Branch instance.

    Raises:
        ValidationError: If a branch with the same name or code already exists.
    """
    try:
        with transaction.atomic():
            branch = Branch.objects.create(**branch_fields)
            log_action(actor, "CREATED_BRANCH", "Branch", branch.id, branch=branch)
            return branch
    except IntegrityError:
        raise ValidationError("A branch with this name or code already exists.")


def create_branch_with_manager(branch_fields: dict, manager_user, assigned_by=None) -> Branch:
    """
    Create a branch and assign its Branch Manager in one transaction.

    Returns:
        Created Branch instance.

    Raises:
        ValidationError: If a branch with the same name or code already exists.
    """
    try:
        with transaction.atomic():
            branch = Branch.objects.create(**branch_fields)
            log_action(assigned_by, "CREATED_BRANCH", "Branch", branch.id, branch=branch)
            assignment_service.assign_role(
                manager_user,
                Roles.BRANCH_MANAGER,
                branch,
                assigned_by=assigned_by,
                is_primary=True,
            )
            return branch
    except IntegrityError:
        raise ValidationError("A branch with this name or code already exists.")


def assign_branch_manager(branch, manager_user, assigned_by=None):
    """Assign a Branch Manager when the branch has no active manager."""
    if branch.assignments.filter(role=Roles.BRANCH_MANAGER, is_active=True).exists():
        raise ValueError("Branch already has an active Branch Manager.")
    
    log_action(assigned_by, "ASSIGNED_BRANCH_MANAGER", "Branch", branch.id, branch=branch)
   
    return assignment_service.assign_role(
        manager_user,
        Roles.BRANCH_MANAGER,
        branch,
        assigned_by=assigned_by,
        is_primary=True,
    )


def change_branch_manager(branch, new_user, assigned_by=None):
    """Replace the active Branch Manager for a branch."""
    with transaction.atomic():
        current_managers = UserAssignment.objects.filter(
            branch=branch, role=Roles.BRANCH_MANAGER, is_active=True
        )
        for manager_assignment in current_managers:
            assignment_service.remove_assignment(manager_assignment, assigned_by)

        new_assignment = assignment_service.assign_role(
            new_user,
            Roles.BRANCH_MANAGER,
            branch,
            assigned_by=assigned_by,
            is_primary=True,
        )
        log_action(assigned_by, "MANAGER_CHANGED", "Branch", branch.id, branch=branch)
        
        return new_assignment


def update_branch(branch, actor=None, **fields) -> Branch:
    """Update branch fields."""
    allowed = {
        "name", "email", "phone_number", "address", "city",
        "state_region", "country", "code",
    }
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return branch

    with transaction.atomic():
        for key, value in updates.items():
            setattr(branch, key, value)
        branch.save(update_fields=list(updates.keys()))
        log_action(actor, "BRANCH_UPDATED", "Branch", branch.id, branch=branch)
    return branch


def activate_branch(branch, actor=None) -> Branch:
    """Set branch status to Active."""
    if branch.status != BranchStatus.ACTIVE:
        branch.status = BranchStatus.ACTIVE
        branch.save(update_fields=["status"])
        log_action(actor, "BRANCH_ACTIVATED", "Branch", branch.id, branch=branch)
    return branch


def deactivate_branch(branch, actor=None) -> Branch:
    """Set branch status to Inactive."""
    if branch.status != BranchStatus.INACTIVE:
        branch.status = BranchStatus.INACTIVE
        branch.save(update_fields=["status"])
        log_action(actor, "BRANCH_DEACTIVATED", "Branch", branch.id, branch=branch)
    return branch


def archive_branch(branch, actor=None) -> Branch:
    """Archive a branch so it cannot receive new assignments."""
    if branch.status != BranchStatus.ARCHIVED:
        branch.status = BranchStatus.ARCHIVED
        branch.save(update_fields=["status"])
        log_action(actor, "BRANCH_ARCHIVED", "Branch", branch.id, branch=branch)
    return branch


def get_branch(branch_id) -> Branch:
    """Fetch a single branch by primary key."""
    try :
        return Branch.objects.get(id=branch_id)
    except Branch.DoesNotExist:
        raise NotFound("Branch not found.")


def list_branches(active_only: bool = False):
    """List branches, optionally filtering to active status only."""
    qs = Branch.objects.all()
    if active_only:
        qs = qs.filter(status=BranchStatus.ACTIVE)
    return qs.order_by("name")


def scoped_branches_queryset(request, active_only: bool = False):
    """
    Return branches visible to the requesting user.

    Args:
        request: DRF request.
        active_only: When True, limit to active branches.

    Returns:
        QuerySet of Branch rows.
    """
    qs = list_branches(active_only=active_only)
    if user_is_super_admin(request.user):
        return qs
    
    branch_ids = get_active_branch_ids(request.user)
    
    return qs.filter(id__in=branch_ids)


def get_branch_or_404(branch_id):
    """Fetch branch by id or raise DoesNotExist."""
    return get_branch(branch_id)


def list_available_branches_for_enrollment(*, sub_program_id, class_type):
    """
    Return branches that have an active class for the given sub-program and class type,
    annotated with whether there is an active enrollment period.
    """
    from datetime import date
    from django.db.models import Exists, OuterRef, Value, BooleanField
    from apps.academic.models import EnrollmentPeriod

    today = date.today()

    qs = Branch.objects.filter(
        status=BranchStatus.ACTIVE,
        classes__sub_program_id=sub_program_id,
        classes__class_type=class_type,
        classes__is_active=True,
    ).distinct()

    if class_type == "GROUP":
        active_period = EnrollmentPeriod.objects.filter(
            branch_id=OuterRef("pk"),
            sub_program_id=sub_program_id,
            class_type=class_type,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )
        qs = qs.annotate(
            has_active_registration=Exists(active_period)
        ).filter(has_active_registration=True)
    else:
        qs = qs.annotate(
            has_active_registration=Value(True, output_field=BooleanField())
        )

    return qs.values("id", "name", "city", "has_active_registration")