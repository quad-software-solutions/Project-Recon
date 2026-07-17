from django.db import transaction

from apps.events.constants import MatchSideType, MatchStatus
from apps.events.models import Match, TournamentTeam


def update_tournament_statistics(tournament):
    """
    Recalculate wins, losses, draws, and points for every team in a
    tournament based on completed match results.

    Points are the sum of the team's side actual scores across all
    completed matches. Wins/losses/draws are determined by comparing
    the two side scores in each match.

    Args:
        tournament: Tournament instance or UUID.
    """
    teams = {
        t.id: t
        for t in TournamentTeam.objects.filter(tournament=tournament)
    }

    for team in teams.values():
        team.wins = 0
        team.losses = 0
        team.draws = 0
        team.points = 0

    completed_matches = Match.objects.filter(
        tournament=tournament,
        status=MatchStatus.COMPLETED,
    ).prefetch_related(
        "sides__participants__tournament_team",
    )

    for match in completed_matches:
        sides_by_type = {}
        for side in match.sides.all():
            sides_by_type[side.side] = side

        side_a = sides_by_type.get(MatchSideType.SIDE_A)
        side_b = sides_by_type.get(MatchSideType.SIDE_B)

        if not side_a or not side_b:
            continue

        for p in side_a.participants.all():
            team = teams.get(p.tournament_team_id)
            if not team:
                continue
            team.points += side_a.score
            if side_a.score > side_b.score:
                team.wins += 1
            elif side_a.score < side_b.score:
                team.losses += 1
            else:
                team.draws += 1

        for p in side_b.participants.all():
            team = teams.get(p.tournament_team_id)
            if not team:
                continue
            team.points += side_b.score
            if side_b.score > side_a.score:
                team.wins += 1
            elif side_b.score < side_a.score:
                team.losses += 1
            else:
                team.draws += 1

    with transaction.atomic():
        TournamentTeam.objects.bulk_update(
            list(teams.values()),
            ["wins", "losses", "draws", "points"],
        )


def get_standings(tournament_id, top_n=None):
    """
    Return teams ordered by ranking (points descending, wins descending,
    then team name ascending).

    Args:
        tournament_id: Tournament UUID.
        top_n: Optional limit on number of teams returned.

    Returns:
        QuerySet of TournamentTeam objects.
    """
    qs = TournamentTeam.objects.filter(
        tournament_id=tournament_id,
    ).order_by("-points", "-wins", "team_name")

    if top_n is not None:
        qs = qs[:top_n]

    return qs


def get_tournament_winner(tournament_id):
    """
    Return the top-ranked team in a tournament.

    Returns None if no completed matches exist for the tournament.

    Args:
        tournament_id: Tournament UUID.

    Returns:
        TournamentTeam instance or None.
    """
    has_matches = Match.objects.filter(
        tournament_id=tournament_id,
        status=MatchStatus.COMPLETED,
    ).exists()
    if not has_matches:
        return None
    return get_standings(tournament_id).first()
