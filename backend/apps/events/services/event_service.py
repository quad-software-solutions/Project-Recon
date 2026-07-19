from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.constants import EventStatus
from apps.events.models import Event
from apps.events.services.validators import EventValidator
from apps.shared.audit.services import log_action


def get_event_or_404(pk):
    """
    Retrieve an Event by primary key or raise NotFound.

    Args:
        pk: Event UUID as string or UUID instance.

    Returns:
        Event instance.

    Raises:
        NotFound: If no matching event exists.
    """
    try:
        return Event.objects.get(id=pk)
    except Event.DoesNotExist:
        raise NotFound("Event not found.")


def list_events(branch_ids=None):
    """
    Return events ordered by creation date descending, optionally scoped by branch.

    Args:
        branch_ids: Optional set/list of branch UUIDs to filter by.

    Returns:
        QuerySet of Event objects.
    """
    qs = Event.objects.all()
    if branch_ids:
        qs = qs.filter(branch_id__in=branch_ids)
    return qs


def create_event(data: dict, actor=None) -> Event:
    """
    Create a new Event after business validation.

    Args:
        data: Dictionary of event fields.
        actor: Optional User performing the action.

    Returns:
        Created Event instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    EventValidator.validate_dates(data.get("start_datetime"), data.get("end_datetime"))
    EventValidator.validate_registration_config(
        data.get("registration_enabled", False),
        data.get("registration_mode"),
        data.get("registration_deadline"),
        data.get("payment_required", False),
        data.get("registration_fee"),
    )
    EventValidator.validate_event_type(data.get("event_type"))

    with transaction.atomic():
        event = Event.objects.create(**data)
        log_action(actor, "CREATE_EVENT", event, event.id)
        return event


def update_event(event: Event, data: dict, actor=None) -> Event:
    """
    Update an existing Event after business validation.

    Only supplied fields are updated.

    Args:
        event: Existing Event instance to update.
        data: Dictionary of fields to update.
        actor: Optional User performing the action.

    Returns:
        Updated Event instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    start_datetime = data.get("start_datetime", event.start_datetime)
    end_datetime = data.get("end_datetime", event.end_datetime)
    EventValidator.validate_dates(start_datetime, end_datetime)

    registration_enabled = data.get("registration_enabled", event.registration_enabled)
    registration_mode = data.get("registration_mode", event.registration_mode)
    registration_deadline = data.get("registration_deadline", event.registration_deadline)
    payment_required = data.get("payment_required", event.payment_required)
    registration_fee = data.get("registration_fee", event.registration_fee)
    EventValidator.validate_registration_config(
        registration_enabled,
        registration_mode,
        registration_deadline,
        payment_required,
        registration_fee,
    )

    with transaction.atomic():
        for key, value in data.items():
            setattr(event, key, value)
        event.save(update_fields=list(data.keys()))
        log_action(actor, "UPDATE_EVENT", event, event.id)
        return event


def delete_event(event: Event, actor=None) -> None:
    """
    Delete an Event after audit logging.

    Args:
        event: Event instance to delete.
        actor: Optional User performing the action.
    """
    with transaction.atomic():
        log_action(
            actor, "DELETE_EVENT", "Event", event.id,
            details={
                "title": event.title,
                "event_type": event.event_type,
                "branch_id": str(event.branch_id) if event.branch_id else None,
                "status": event.status,
            },
        )
        event.delete()


def publish_event(event: Event, actor=None) -> Event:
    """
    Publish an Event by setting status to PUBLISHED.

    Args:
        event: Event instance to publish.
        actor: Optional User performing the action.

    Returns:
        Updated Event instance.

    Raises:
        ValidationError: If event is not in DRAFT status.
    """
    if event.status != EventStatus.DRAFT:
        raise ValidationError(
            f"Cannot publish event with status '{event.status}'. "
            "Only draft events can be published."
        )
    with transaction.atomic():
        event.status = EventStatus.PUBLISHED
        event.save(update_fields=["status"])
        log_action(actor, "PUBLISH_EVENT", event, event.id)
        return event


def unpublish_event(event: Event, actor=None) -> Event:
    """
    Unpublish an Event by setting status back to DRAFT.

    Args:
        event: Event instance to unpublish.
        actor: Optional User performing the action.

    Returns:
        Updated Event instance.

    Raises:
        ValidationError: If event is not in PUBLISHED status.
    """
    if event.status != EventStatus.PUBLISHED:
        raise ValidationError(
            f"Cannot unpublish event with status '{event.status}'. "
            "Only published events can be unpublished."
        )
    with transaction.atomic():
        event.status = EventStatus.DRAFT
        event.save(update_fields=["status"])
        log_action(actor, "UNPUBLISH_EVENT", event, event.id)
        return event


def activate_event(event: Event, actor=None) -> Event:
    """
    Activate an Event by setting is_active to True.

    Args:
        event: Event instance to activate.
        actor: Optional User performing the action.

    Returns:
        Updated Event instance.
    """
    with transaction.atomic():
        event.is_active = True
        event.save(update_fields=["is_active"])
        log_action(actor, "ACTIVATE_EVENT", event, event.id)
        return event


def deactivate_event(event: Event, actor=None) -> Event:
    """
    Deactivate an Event by setting is_active to False.

    Args:
        event: Event instance to deactivate.
        actor: Optional User performing the action.

    Returns:
        Updated Event instance.
    """
    with transaction.atomic():
        event.is_active = False
        event.save(update_fields=["is_active"])
        log_action(actor, "DEACTIVATE_EVENT", event, event.id)
        return event
