from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.constants import MatchSideType, MatchStatus
from apps.events.models import Match, MatchParticipant, MatchSide, Tournament
from apps.events.services.ranking_service import update_tournament_statistics
from apps.events.services.validators import MatchValidator
from apps.shared.audit.services import log_action


def get_match_or_404(pk):
    """
    Retrieve a Match by primary key or raise NotFound.

    Args:
        pk: Match UUID as string or UUID instance.

    Returns:
        Match instance with related tournament, event, and sides with participants.
    """
    try:
        return Match.objects.select_related(
            "tournament__event", "winning_side"
        ).prefetch_related(
            "sides__participants__tournament_team"
        ).get(id=pk)
    except Match.DoesNotExist:
        raise NotFound("Match not found.")


def list_matches(tournament_id=None, branch_ids=None):
    """
    Return matches, optionally filtered by tournament or branch.

    Args:
        tournament_id: Optional tournament UUID to filter by.
        branch_ids: Optional set/list of branch UUIDs to scope by.

    Returns:
        QuerySet of Match objects with related tournament and sides.
    """
    qs = Match.objects.select_related(
        "tournament__event", "winning_side"
    ).prefetch_related(
        "sides__participants__tournament_team"
    ).all()
    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)
    if branch_ids:
        qs = qs.filter(tournament__event__branch_id__in=branch_ids)
    return qs


def create_match(data: dict, actor=None) -> Match:
    """
    Create a new Match with two empty Match Sides.

    Args:
        data: Dictionary with 'tournament' (UUID or instance), 'round',
              'scheduled_at', optional 'started_at'.
        actor: Optional User performing the action.

    Returns:
        Created Match instance with sides.

    Raises:
        ValidationError: If business rules are violated.
    """
    tournament = data.pop("tournament", None)
    if not tournament:
        raise ValidationError("Tournament is required to create a match.")
    if not isinstance(tournament, Tournament):
        try:
            tournament = Tournament.objects.select_related("event").get(id=tournament)
        except Tournament.DoesNotExist:
            raise NotFound("Tournament not found.")

    if not data.get("round"):
        raise ValidationError("Round is required.")
    if not data.get("scheduled_at"):
        raise ValidationError("Scheduled date/time is required.")

    MatchValidator.validate_tournament_not_closed(tournament)

    with transaction.atomic():
        match = Match.objects.create(tournament=tournament, **data)
        side_a = MatchSide.objects.create(match=match, side=MatchSideType.SIDE_A)
        side_b = MatchSide.objects.create(match=match, side=MatchSideType.SIDE_B)
        log_action(actor, "CREATE_MATCH", match, match.id)
        return match


def update_match(match: Match, data: dict, actor=None) -> Match:
    """
    Update an existing Match.

    Args:
        match: Match instance to update.
        data: Dictionary of fields to update.
        actor: Optional User performing the action.

    Returns:
        Updated Match instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    if "tournament" in data:
        raise ValidationError("Cannot change the tournament of a match.")

    MatchValidator.validate_tournament_not_closed(match.tournament)
    MatchValidator.validate_match_not_completed(match)

    with transaction.atomic():
        for key, value in data.items():
            setattr(match, key, value)
        match.save(update_fields=list(data.keys()))
        log_action(actor, "UPDATE_MATCH", match, match.id)
        return match


def delete_match(match: Match, actor=None) -> None:
    """
    Delete a Match. Cascade deletes its sides and participants.

    Args:
        match: Match instance to delete.
        actor: Optional User performing the action.

    Raises:
        ValidationError: If tournament is closed.
    """
    MatchValidator.validate_tournament_not_closed(match.tournament)
    tournament = match.tournament

    with transaction.atomic():
        log_action(
            actor, "DELETE_MATCH", "Match", match.id,
            details={
                "tournament_id": str(match.tournament_id),
                "round": match.round,
                "status": match.status,
            },
        )
        match.delete()
        update_tournament_statistics(tournament)


def assign_team_to_side(match: Match, side_type: str, team, actor=None) -> MatchParticipant:
    """
    Assign a TournamentTeam to a Match Side.

    Args:
        match: Match instance.
        side_type: 'SIDE_A' or 'SIDE_B'.
        team: TournamentTeam instance or UUID.
        actor: Optional User performing the action.

    Returns:
        Created MatchParticipant instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    from apps.events.models import TournamentTeam

    if not isinstance(team, TournamentTeam):
        try:
            team = TournamentTeam.objects.get(id=team)
        except TournamentTeam.DoesNotExist:
            raise NotFound("Tournament team not found.")

    MatchValidator.validate_match_not_completed(match)
    MatchValidator.validate_team_belongs_to_tournament(team, match)
    MatchValidator.validate_team_not_duplicate_in_match(match, team)

    try:
        side = match.sides.get(side=side_type)
    except MatchSide.DoesNotExist:
        raise ValidationError(f"Invalid side '{side_type}'.")

    with transaction.atomic():
        participant = MatchParticipant.objects.create(
            match_side=side,
            tournament_team=team,
        )
        log_action(actor, "ASSIGN_TEAM_TO_MATCH", team, team.id)
        return participant


def remove_team_from_side(match: Match, side_type: str, team, actor=None) -> None:
    """
    Remove a TournamentTeam from a Match Side.

    Args:
        match: Match instance.
        side_type: 'SIDE_A' or 'SIDE_B'.
        team: TournamentTeam instance or UUID.
        actor: Optional User performing the action.

    Raises:
        ValidationError: If business rules are violated.
    """
    from apps.events.models import TournamentTeam

    if not isinstance(team, TournamentTeam):
        try:
            team = TournamentTeam.objects.get(id=team)
        except TournamentTeam.DoesNotExist:
            raise NotFound("Tournament team not found.")

    MatchValidator.validate_match_not_completed(match)

    try:
        side = match.sides.get(side=side_type)
    except MatchSide.DoesNotExist:
        raise ValidationError(f"Invalid side '{side_type}'.")

    try:
        participant = MatchParticipant.objects.get(
            match_side=side,
            tournament_team=team,
        )
    except MatchParticipant.DoesNotExist:
        raise ValidationError("Team is not assigned to this side.")

    with transaction.atomic():
        log_action(actor, "REMOVE_TEAM_FROM_MATCH", team, team.id)
        participant.delete()


def record_scores(match: Match, side_a_score: int, side_b_score: int, actor=None) -> Match:
    """
    Record alliance scores for both sides of a match.

    Args:
        match: Match instance.
        side_a_score: Score for Side A.
        side_b_score: Score for Side B.
        actor: Optional User performing the action.

    Returns:
        Updated Match instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    MatchValidator.validate_match_not_completed(match)

    MatchValidator.validate_scores_non_negative(side_a_score)
    MatchValidator.validate_scores_non_negative(side_b_score)

    with transaction.atomic():
        sides = {s.side: s for s in match.sides.all()}
        side_a = sides[MatchSideType.SIDE_A]
        side_b = sides[MatchSideType.SIDE_B]

        side_a.score = side_a_score
        side_b.score = side_b_score
        side_a.save(update_fields=["score"])
        side_b.save(update_fields=["score"])

        log_action(actor, "RECORD_SCORES", match, match.id)
        update_tournament_statistics(match.tournament)
        return match


def complete_match(match: Match, actor=None) -> Match:
    """
    Complete a match by calculating the winning side.

    Args:
        match: Match instance.
        actor: Optional User performing the action.

    Returns:
        Completed Match instance.

    Raises:
        ValidationError: If business rules are violated.
    """
    from django.utils import timezone

    MatchValidator.validate_match_not_completed(match)
    MatchValidator.validate_both_sides_have_teams(match)

    sides = {s.side: s for s in match.sides.all()}
    side_a = sides[MatchSideType.SIDE_A]
    side_b = sides[MatchSideType.SIDE_B]

    winning_side = None
    if side_a.score > side_b.score:
        winning_side = side_a
    elif side_b.score > side_a.score:
        winning_side = side_b

    with transaction.atomic():
        match.status = MatchStatus.COMPLETED
        match.completed_at = timezone.now()
        match.winning_side = winning_side
        match.save(update_fields=["status", "completed_at", "winning_side"])
        log_action(actor, "COMPLETE_MATCH", match, match.id)
        update_tournament_statistics(match.tournament)
        return match
