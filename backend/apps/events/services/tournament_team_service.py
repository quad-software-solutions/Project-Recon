from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.models import Tournament, TournamentTeam
from apps.events.services.validators import TournamentTeamValidator
from apps.shared.audit.services import log_action


def get_team_or_404(pk):
    """
    Retrieve a TournamentTeam by primary key or raise NotFound.

    Args:
        pk: Team UUID as string or UUID instance.

    Returns:
        TournamentTeam instance with related tournament and event.
    """
    try:
        return TournamentTeam.objects.select_related(
            "tournament__event"
        ).get(id=pk)
    except TournamentTeam.DoesNotExist:
        raise NotFound("Tournament team not found.")


def list_teams(tournament_id=None, branch_ids=None):
    """
    Return teams, optionally filtered by tournament or branch.

    Args:
        tournament_id: Optional tournament UUID to filter by.
        branch_ids: Optional set/list of branch UUIDs to scope by.

    Returns:
        QuerySet of TournamentTeam objects.
    """
    qs = TournamentTeam.objects.select_related("tournament__event").all()
    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)
    if branch_ids:
        qs = qs.filter(tournament__event__branch_id__in=branch_ids)
    return qs


def create_team(data: dict, actor=None) -> TournamentTeam:
    """
    Create a new TournamentTeam after business validation.

    Args:
        data: Dictionary with 'tournament' (UUID or instance), 'team_name',
              optional fields.
        actor: Optional User performing the action.

    Returns:
        Created TournamentTeam instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    tournament = data.pop("tournament", None)
    if not tournament:
        raise ValidationError("Tournament is required to create a team.")
    if not isinstance(tournament, Tournament):
        try:
            tournament = Tournament.objects.select_related("event").get(id=tournament)
        except Tournament.DoesNotExist:
            raise NotFound("Tournament not found.")

    team_name = data.get("team_name")
    if not team_name:
        raise ValidationError("Team name is required.")

    TournamentTeamValidator.validate_tournament_not_closed(tournament)
    TournamentTeamValidator.validate_unique_name(tournament.id, team_name)
    TournamentTeamValidator.validate_max_teams(tournament)

    with transaction.atomic():
        team = TournamentTeam.objects.create(tournament=tournament, **data)
        log_action(actor, "CREATE_TOURNAMENT_TEAM", team, team.id)
        return team


def update_team(team: TournamentTeam, data: dict, actor=None) -> TournamentTeam:
    """
    Update an existing TournamentTeam.

    Args:
        team: TournamentTeam instance to update.
        data: Dictionary of fields to update.
        actor: Optional User performing the action.

    Returns:
        Updated TournamentTeam instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    if "tournament" in data:
        raise ValidationError("Cannot change the tournament of a team.")

    TournamentTeamValidator.validate_tournament_not_closed(team.tournament)

    team_name = data.get("team_name", team.team_name)
    TournamentTeamValidator.validate_unique_name(
        team.tournament_id, team_name, exclude_id=team.id
    )

    with transaction.atomic():
        for key, value in data.items():
            setattr(team, key, value)
        team.save(update_fields=list(data.keys()))
        log_action(actor, "UPDATE_TOURNAMENT_TEAM", team, team.id)
        return team


def delete_team(team: TournamentTeam, actor=None) -> None:
    """
    Delete a TournamentTeam after audit logging.

    Args:
        team: TournamentTeam instance to delete.
        actor: Optional User performing the action.

    Raises:
        ValidationError: If tournament is closed.
    """
    TournamentTeamValidator.validate_tournament_not_closed(team.tournament)
    TournamentTeamValidator.validate_team_not_in_completed_match(team)

    with transaction.atomic():
        log_action(
            actor, "DELETE_TOURNAMENT_TEAM", "TournamentTeam", team.id,
            details={
                "team_name": team.team_name,
                "tournament_id": str(team.tournament_id),
            },
        )
        team.delete()
