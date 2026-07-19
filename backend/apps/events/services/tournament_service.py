from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.models import Event, Tournament, TournamentCategory
from apps.events.services.event_service import get_event_or_404
from apps.events.services.validators import TournamentValidator
from apps.shared.audit.services import log_action


def get_tournament_or_404(pk):
    """
    Retrieve a Tournament by primary key or raise NotFound.

    Args:
        pk: Tournament UUID as string or UUID instance.

    Returns:
        Tournament instance.
    """
    try:
        return Tournament.objects.select_related("event", "category").get(id=pk)
    except Tournament.DoesNotExist:
        raise NotFound("Tournament not found.")


def list_tournaments(branch_ids=None):
    """
    Return tournaments ordered by creation date descending, optionally scoped by branch.

    Args:
        branch_ids: Optional set/list of branch UUIDs to filter by.

    Returns:
        QuerySet of Tournament objects with related event.
    """
    qs = Tournament.objects.select_related("event", "category").all()
    if branch_ids:
        qs = qs.filter(event__branch_id__in=branch_ids)
    return qs


def create_tournament(data: dict, actor=None) -> Tournament:
    """
    Create a new Tournament linked to an existing Event.

    Args:
        data: Dictionary with 'event' (Event instance or UUID), 'category',
              optional 'max_teams', 'prize_pool'.
        actor: Optional User performing the action.

    Returns:
        Created Tournament instance.

    Raises:
        NotFound: If referenced Event does not exist.
        ValidationError: If business rules are violated.
    """
    event = data.pop("event", None)
    if not event:
        raise ValidationError("Event is required to create a tournament.")
    if not isinstance(event, Event):
        event = get_event_or_404(event)

    category = data.pop("category", None)
    if not category:
        raise ValidationError("Category is required to create a tournament.")
    if not isinstance(category, TournamentCategory):
        try:
            category = TournamentCategory.objects.get(id=category)
        except TournamentCategory.DoesNotExist:
            raise ValidationError("Category not found.")

    TournamentValidator.validate_event_type(event)
    TournamentValidator.validate_max_teams(data.get("max_teams"))
    TournamentValidator.validate_prize_pool(data.get("prize_pool"))

    with transaction.atomic():
        tournament = Tournament.objects.create(event=event, category=category, **data)
        log_action(actor, "CREATE_TOURNAMENT", tournament, tournament.id)
        return tournament


def update_tournament(tournament: Tournament, data: dict, actor=None) -> Tournament:
    """
    Update an existing Tournament.

    Args:
        tournament: Tournament instance to update.
        data: Dictionary of fields to update.
        actor: Optional User performing the action.

    Returns:
        Updated Tournament instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    if "event" in data:
        raise ValidationError("Cannot change the event of a tournament.")

    TournamentValidator.validate_max_teams(
        data.get("max_teams", tournament.max_teams)
    )
    TournamentValidator.validate_prize_pool(
        data.get("prize_pool", tournament.prize_pool)
    )

    category = data.pop("category", None)
    if category and not isinstance(category, TournamentCategory):
        try:
            category = TournamentCategory.objects.get(id=category)
        except TournamentCategory.DoesNotExist:
            raise ValidationError("Category not found.")

    with transaction.atomic():
        for key, value in data.items():
            setattr(tournament, key, value)
        if category:
            tournament.category = category
        update_fields = list(data.keys())
        if category:
            update_fields.append("category")
        tournament.save(update_fields=update_fields)
        log_action(actor, "UPDATE_TOURNAMENT", tournament, tournament.id)
        return tournament


def delete_tournament(tournament: Tournament, actor=None) -> None:
    """
    Delete a Tournament after audit logging.

    Args:
        tournament: Tournament instance to delete.
        actor: Optional User performing the action.
    """
    with transaction.atomic():
        log_action(
            actor, "DELETE_TOURNAMENT", "Tournament", tournament.id,
            details={
                "event_id": str(tournament.event_id),
                "category_id": str(tournament.category_id),
                "is_closed": tournament.is_closed,
            },
        )
        tournament.delete()


def close_tournament(tournament: Tournament, actor=None) -> Tournament:
    """
    Close a Tournament to prevent further modifications.

    Args:
        tournament: Tournament instance to close.
        actor: Optional User performing the action.

    Returns:
        Updated Tournament instance.

    Raises:
        ValidationError: If tournament is already closed.
    """
    if tournament.is_closed:
        raise ValidationError("Tournament is already closed.")
    with transaction.atomic():
        tournament.is_closed = True
        tournament.save(update_fields=["is_closed"])
        log_action(actor, "CLOSE_TOURNAMENT", tournament, tournament.id)
        return tournament


def reopen_tournament(tournament: Tournament, actor=None) -> Tournament:
    """
    Reopen a closed Tournament.

    Args:
        tournament: Tournament instance to reopen.
        actor: Optional User performing the action.

    Returns:
        Updated Tournament instance.

    Raises:
        ValidationError: If tournament is not closed.
    """
    if not tournament.is_closed:
        raise ValidationError("Tournament is not closed.")
    with transaction.atomic():
        tournament.is_closed = False
        tournament.save(update_fields=["is_closed"])
        log_action(actor, "REOPEN_TOURNAMENT", tournament, tournament.id)
        return tournament
