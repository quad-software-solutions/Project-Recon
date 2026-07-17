from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.permissions.roles import (
    user_is_branch_manager,
    user_is_instructor,
    user_is_secretary,
    user_is_super_admin,
    user_manages_branch,
)


def _get_obj_branch_id(obj):
    """
    Resolve the branch UUID from any events-related model instance.

    Handles: Event, Tournament, Match, TournamentTeam, Workshop,
    EventRegistration, EventPayment.
    """
    from apps.events.models import (
        Event,
        EventPayment,
        EventRegistration,
        Match,
        Tournament,
        TournamentTeam,
        Workshop,
    )

    if isinstance(obj, Event):
        return obj.branch_id
    if isinstance(obj, Tournament):
        return obj.event.branch_id
    if isinstance(obj, Match):
        return obj.tournament.event.branch_id
    if isinstance(obj, TournamentTeam):
        return obj.tournament.event.branch_id
    if isinstance(obj, Workshop):
        return obj.event.branch_id
    if isinstance(obj, EventRegistration):
        return obj.event.branch_id
    if isinstance(obj, EventPayment):
        return obj.registration.event.branch_id
    return None


def _user_can_access_branch_obj(user, obj) -> bool:
    """Check if a user (SA, BM, or Secretary) can access an object by branch."""
    if user_is_super_admin(user):
        return True
    branch_id = _get_obj_branch_id(obj)
    if branch_id is None:
        return True
    return user_manages_branch(user, branch_id)


class IsEventStaff(BasePermission):
    """
    Allow access to Super Admin or Branch Manager.

    Object-level enforces branch scoping for Branch Managers.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (user_is_super_admin(request.user) or user_is_branch_manager(request.user))
        )

    def has_object_permission(self, request, view, obj):
        return _user_can_access_branch_obj(request.user, obj)


class IsEventRegistrationStaff(BasePermission):
    """
    Allow access to Super Admin, Branch Manager, or Secretary.

    Used for registration management views.
    Object-level enforces branch scoping.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                user_is_super_admin(request.user)
                or user_is_branch_manager(request.user)
                or user_is_secretary(request.user)
            )
        )

    def has_object_permission(self, request, view, obj):
        return _user_can_access_branch_obj(request.user, obj)


class IsEventStaffOrInstructor(BasePermission):
    """
    Allow access to Super Admin, Branch Manager, or an assigned Instructor.

    - Super Admin: unrestricted.
    - Branch Manager: scoped by branch, can create/delete.
    - Instructor: may only list/retrieve/update their own workshops.
      Create (POST) and delete (DELETE) are forbidden for instructors.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_is_super_admin(user) or user_is_branch_manager(user):
            return True
        if user_is_instructor(user):
            if request.method == 'POST':
                return False
            return True
        return False

    def has_object_permission(self, request, view, obj):
        if user_is_super_admin(request.user):
            return True
        if user_is_branch_manager(request.user):
            return _user_can_access_branch_obj(request.user, obj)
        if user_is_instructor(request.user):
            if request.method == 'DELETE':
                return False
            if hasattr(obj, "instructor"):
                return obj.instructor == request.user
            return True
        return False
