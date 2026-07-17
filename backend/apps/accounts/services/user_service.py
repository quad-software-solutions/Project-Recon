"""
User lifecycle service.
"""

from django.db import transaction
from django.db.models import Prefetch
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import NotFound

from apps.accounts.models import User
from apps.accounts.constants import AccountStatus, Roles
from apps.accounts.models.user_assignment import UserAssignment
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin
from apps.accounts.services import assignment_service
from apps.accounts.validators import normalize_phone_number
from apps.shared.audit.services import log_action

_ACTIVE_ASSIGNMENTS_PREFETCH = Prefetch(
    "assignments",
    queryset=UserAssignment.objects.select_related("branch"),
)

_UPDATABLE_USER_FIELDS = frozenset({
    "first_name",
    "last_name",
    "phone_number",
    "profile_picture",
    "date_of_birth",
    "gender",
})

def get_user_list_queryset(request):
    """
    Return a filtered queryset based on the requester role.

    Args:
        request: DRF request with authenticated user.

    Returns:
        QuerySet of User rows.
    """
    
    search = request.query_params.get("search")
    if search:
        qs = search_users(search)

        if not user_is_super_admin(request.user):
            branch_ids = get_active_branch_ids(request.user)
            qs = qs.filter(
                assignments__branch_id__in=branch_ids, assignments__is_active=True
            ).distinct()
    else:
        qs = scoped_users_queryset(request)

    return qs

def _create_user_with_role(
    email,
    first_name,
    last_name,
    password,
    status,
    is_email_verified,
    role,
    branch,
    is_staff=False,
    bypass_password_validation=False,
    assigned_by=None,
):
    """
    Internal helper to create a user and primary role assignment atomically.

    Returns:
        Created User instance.
    """
    if not bypass_password_validation:
        validate_password(password)

    with transaction.atomic():
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            status=status,
            is_email_verified=is_email_verified,
            is_staff=is_staff,
        )
    
        assignment_service.assign_role(
            user, role, branch, assigned_by=assigned_by, is_primary=True
        )

        log_action(assigned_by, "USER_CREATED_WITH_ROLE_AND_ASSIGNED_ROLE", "User", user.id)

        return user


def create_super_admin(
    email,
    first_name,
    last_name,
    password,
    bypass_password_validation=True,
    assigned_by=None,
):
    """
    Create a Super Admin (management command / terminal path).

    Args:
        email: Unique email address.
        first_name: Given name.
        last_name: Family name.
        password: Plain-text password.
        bypass_password_validation: Skip Django password validators when True.
        assigned_by: Optional creating administrator.

    Returns:
        Created User instance.
    """



    return _create_user_with_role(
        email,
        first_name,
        last_name,
        password,
        status=AccountStatus.ACTIVE,
        is_email_verified=True,
        role=Roles.SUPER_ADMIN,
        branch=None,
        is_staff=True,
        bypass_password_validation=bypass_password_validation,
        assigned_by=assigned_by,
    )


def create_staff_user(
    email,
    first_name,
    last_name,
    password,
    branch,
    role=Roles.INSTRUCTOR,
    assigned_by=None,
):
    """
    Create a staff user (Instructor by default) pending email verification.

    Returns:
        Created User instance.
    """
    return _create_user_with_role(
        email,
        first_name,
        last_name,
        password,
        status=AccountStatus.PENDING,
        is_email_verified=False,
        role=role,
        branch=branch,
        assigned_by=assigned_by,
    )


def create_branch_manager(email, first_name, last_name, password, branch, assigned_by=None):
    """
    Create a Branch Manager with an automatic branch assignment.

    Returns:
        Created User instance.
    """
    return _create_user_with_role(
        email,
        first_name,
        last_name,
        password,
        status=AccountStatus.PENDING,
        is_email_verified=False,
        role=Roles.BRANCH_MANAGER,
        branch=branch,
        assigned_by=assigned_by,
    )


def create_student_user(email, first_name, last_name, password, branch, assigned_by=None):
    """
    Create a student user (intended for Academic module orchestration).

    Returns:
        Created User instance.
    """
    return _create_user_with_role(
        email,
        first_name,
        last_name,
        password,
        status=AccountStatus.PENDING,
        is_email_verified=False,
        role=Roles.STUDENT,
        branch=branch,
        assigned_by=assigned_by,
    )


def update_user(user, actor=None, **fields) -> User:
    """
    Update allowed profile fields on a user.

    Args:
        user: User instance to update.
        actor: Optional actor for audit logging.
        **fields: Subset of first_name, last_name, phone_number, profile_picture,
            date_of_birth, gender.

    Returns:
        Updated User instance.
    """
    updates = {k: v for k, v in fields.items() if k in _UPDATABLE_USER_FIELDS}
    if "phone_number" in updates:
        updates["phone_number"] = normalize_phone_number(updates["phone_number"])

    if not updates:
        return user

    with transaction.atomic():
        for key, value in updates.items():
            setattr(user, key, value)
        user.save(update_fields=list(updates.keys()))
        log_action(actor, "UPDATE_USER", "User", user.id)

    return user


def change_email(user, new_email: str, password: str = None, actor=None) -> None:
    """
    Change a user's email and reset email-verified status.

    Requires the current password for confirmation.

    Args:
        user: User instance.
        new_email: New email address.
        password: Current password to confirm the change.
        actor: Optional actor for audit logging.

    Raises:
        AuthenticationFailed: If password is missing or incorrect.
    """
    from rest_framework.exceptions import AuthenticationFailed

    if not password:
        raise AuthenticationFailed("Current password is required to change email.")
    if not user.check_password(password):
        raise AuthenticationFailed("Current password is incorrect.")

    with transaction.atomic():
        user.email = new_email.strip().lower()
        user.is_email_verified = False
        user.save(update_fields=["email", "is_email_verified"])
        log_action(actor, "EMAIL_CHANGED", "User", user.id)

def change_password(user, new_password: str, actor=None) -> None:
    """
    Change a user's password.

    Args:
        user: User instance.
        new_password: New plain-text password.
        actor: Optional actor for audit logging.
    """
    validate_password(new_password)
    with transaction.atomic():
        user.set_password(new_password)
        user.save(update_fields=["password"])
        log_action(actor, "PASSWORD_CHANGED", "User", user.id)

def activate_user(user, actor=None) -> None:
    """Set user status to Active."""
    user.status = AccountStatus.ACTIVE
    user.save(update_fields=["status"])
    log_action(actor, "ACTIVATE_USER", "User", user.id)


def deactivate_user(user, actor=None) -> None:
    """Set user status to Suspended."""
    user.status = AccountStatus.SUSPENDED
    user.save(update_fields=["status"])
    log_action(actor, "user.deactivated", "User", user.id)


def archive_user(user, actor=None) -> None:
    """Set user status to Archived."""
    user.status = AccountStatus.ARCHIVED
    user.save(update_fields=["status"])
    log_action(actor, "user.archived", "User", user.id)


def get_user(user_id) -> User:
    """
    Fetch a user with assignments prefetched (with branch select_related).

    Args:
        user_id: UUID primary key.

    Returns:
        User instance.
    """
    return User.objects.prefetch_related(_ACTIVE_ASSIGNMENTS_PREFETCH).get(id=user_id)


def list_users():
    """
    Return all users with assignments prefetched (with branch select_related).

    Returns:
        QuerySet of User rows.
    """
    return User.objects.prefetch_related(_ACTIVE_ASSIGNMENTS_PREFETCH).all()


def search_users(query: str):
    """
    Search users by case-insensitive email substring.

    Args:
        query: Search string.

    Returns:
        QuerySet of matching User rows.
    """
    return User.objects.prefetch_related(_ACTIVE_ASSIGNMENTS_PREFETCH).filter(email__icontains=query)


def _check_user_scope(request, user) -> None:
        from apps.accounts.permissions.roles import user_is_super_admin, get_active_branch_ids
        if user_is_super_admin(request.user):
            return
        if user_is_super_admin(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this user.")
        branch_ids = get_active_branch_ids(request.user)
        if not any(a.branch_id in branch_ids and a.is_active for a in user.assignments.all()):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this user.")

def scoped_users_queryset(request):
    """
    Return users visible to the requesting administrator.

    Args:
        request: DRF request with authenticated user.

    Returns:
        QuerySet of User rows.
    """
    if user_is_super_admin(request.user):
        return list_users()
    
    branch_ids = get_active_branch_ids(request.user)
    return (
        User.objects.filter(
            assignments__branch_id__in=branch_ids,
            assignments__is_active=True,
        )
        .distinct()
        .prefetch_related(_ACTIVE_ASSIGNMENTS_PREFETCH)
    )


def scoped_assignments_queryset(request, user_id=None, branch_id=None, role=None):
    """
    Return assignments visible to the requesting user.

    Args:
        request: DRF request.
        user_id: Optional user filter.
        branch_id: Optional branch filter.
        role: Optional role filter.

    Returns:
        QuerySet of UserAssignment rows.
    """
    qs = assignment_service.list_assignments(
        user=None, branch=None, role=role, active_only=True
    )
    if user_id:
        qs = qs.filter(user_id=user_id)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    if not user_is_super_admin(request.user):
        branch_ids = get_active_branch_ids(request.user)
        qs = qs.filter(branch_id__in=branch_ids)
    return qs


def get_user_or_404(user_id):
    """Fetch user by id or raise DoesNotExist."""
    try:
        return User.objects.prefetch_related(_ACTIVE_ASSIGNMENTS_PREFETCH).get(id=user_id)
    except User.DoesNotExist:
        raise NotFound("User not found.")


def get_assignment_or_404(assignment_id):
    """Fetch assignment by id or raise DoesNotExist."""
    try:
        return UserAssignment.objects.select_related("user", "branch", "assigned_by").get(
            id=assignment_id
        )
    except UserAssignment.DoesNotExist:
        raise NotFound("Assignment not found.")
