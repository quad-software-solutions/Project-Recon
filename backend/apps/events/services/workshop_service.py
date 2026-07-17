from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import User
from apps.events.models import Event, Workshop
from apps.events.services.validators import WorkshopValidator
from apps.shared.audit.services import log_action


def get_workshop_or_404(pk):
    """
    Retrieve a Workshop by primary key or raise NotFound.

    Args:
        pk: Workshop UUID as string or UUID instance.

    Returns:
        Workshop instance with related event and instructor.
    """
    try:
        return Workshop.objects.select_related(
            "event", "instructor"
        ).get(id=pk)
    except Workshop.DoesNotExist:
        raise NotFound("Workshop not found.")


def list_workshops(user=None, branch_ids=None):
    """
    Return workshops, optionally filtered by instructor or branch.

    Args:
        user: Optional User to filter by (instructors see only their own).
        branch_ids: Optional set/list of branch UUIDs to scope by.

    Returns:
        QuerySet of Workshop objects.
    """
    from apps.accounts.permissions.roles import user_is_branch_manager, user_is_super_admin

    qs = Workshop.objects.select_related("event", "instructor").all()

    if user and not (
        user_is_super_admin(user) or user_is_branch_manager(user)
    ):
        qs = qs.filter(instructor=user)

    if branch_ids:
        qs = qs.filter(event__branch_id__in=branch_ids)

    return qs


def create_workshop(data: dict, actor=None) -> Workshop:
    """
    Create a new Workshop after business validation.

    Args:
        data: Dictionary with 'event' (UUID or instance), 'instructor' (UUID),
              'duration_minutes', 'level', optional 'price'.
        actor: Optional User performing the action.

    Returns:
        Created Workshop instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    event = data.pop("event", None)
    if not event:
        raise ValidationError("Event is required to create a workshop.")
    if not isinstance(event, Event):
        try:
            event = Event.objects.get(id=event)
        except Event.DoesNotExist:
            raise NotFound("Event not found.")

    instructor = data.get("instructor", None)
    if not instructor:
        raise ValidationError("Instructor is required.")
    if not isinstance(instructor, User):
        try:
            instructor = User.objects.get(id=instructor)
            data["instructor"] = instructor
        except User.DoesNotExist:
            raise NotFound("Instructor not found.")

    WorkshopValidator.validate_event_type(event)
    WorkshopValidator.validate_duration(data.get("duration_minutes"))

    with transaction.atomic():
        workshop = Workshop.objects.create(event=event, **data)
        log_action(actor, "CREATE_WORKSHOP", workshop, workshop.id)
        return workshop


def update_workshop(workshop: Workshop, data: dict, actor=None) -> Workshop:
    """
    Update an existing Workshop.

    Args:
        workshop: Workshop instance to update.
        data: Dictionary of fields to update.
        actor: Optional User performing the action.

    Returns:
        Updated Workshop instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    if "event" in data:
        raise ValidationError("Cannot change the event of a workshop.")

    if "instructor" in data:
        instructor = data["instructor"]
        if not isinstance(instructor, User):
            try:
                instructor = User.objects.get(id=instructor)
                data["instructor"] = instructor
            except User.DoesNotExist:
                raise NotFound("Instructor not found.")

    if "duration_minutes" in data:
        WorkshopValidator.validate_duration(data["duration_minutes"])

    with transaction.atomic():
        for key, value in data.items():
            setattr(workshop, key, value)
        workshop.save(update_fields=list(data.keys()))
        log_action(actor, "UPDATE_WORKSHOP", workshop, workshop.id)
        return workshop


def delete_workshop(workshop: Workshop, actor=None) -> None:
    """
    Delete a Workshop after audit logging.

    Args:
        workshop: Workshop instance to delete.
        actor: Optional User performing the action.
    """
    with transaction.atomic():
        log_action(actor, "DELETE_WORKSHOP", workshop, workshop.id)
        workshop.delete()
