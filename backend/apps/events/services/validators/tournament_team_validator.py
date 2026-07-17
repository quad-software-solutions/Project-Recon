from rest_framework.exceptions import ValidationError

from apps.events.constants import MatchStatus
from apps.events.models import MatchParticipant, TournamentTeam


class TournamentTeamValidator:
    """
    Reusable business validation for TournamentTeam operations.
    """

    @staticmethod
    def validate_unique_name(tournament_id, team_name, exclude_id=None):
        """
        Ensure team_name is unique within the tournament.

        Args:
            tournament_id: Tournament UUID.
            team_name: Team name to check.
            exclude_id: Optional team UUID to exclude (for updates).

        Raises:
            ValidationError: If a team with the same name exists.
        """
        qs = TournamentTeam.objects.filter(
            tournament_id=tournament_id,
            team_name__iexact=team_name,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            raise ValidationError(
                f"A team with the name '{team_name}' already exists in this tournament."
            )

    @staticmethod
    def validate_max_teams(tournament):
        """
        Check that the tournament has not reached its max_teams limit.

        Args:
            tournament: Tournament instance.

        Raises:
            ValidationError: If max_teams is set and would be exceeded.
        """
        if tournament.max_teams is not None:
            current_count = tournament.teams.count()
            if current_count >= tournament.max_teams:
                raise ValidationError(
                    f"Tournament has reached its maximum team limit of {tournament.max_teams}."
                )

    @staticmethod
    def validate_tournament_not_closed(tournament):
        """
        Ensure the tournament is not closed.

        Args:
            tournament: Tournament instance.

        Raises:
            ValidationError: If tournament is closed.
        """
        if tournament.is_closed:
            raise ValidationError("Cannot modify teams in a closed tournament.")

    @staticmethod
    def validate_team_not_in_completed_match(team):
        """
        Ensure the team is not a participant in any completed match.

        Args:
            team: TournamentTeam instance.

        Raises:
            ValidationError: If team is in a completed match.
        """
        exists = MatchParticipant.objects.filter(
            tournament_team=team,
            match_side__match__status=MatchStatus.COMPLETED,
        ).exists()
        if exists:
            raise ValidationError(
                f"Cannot delete team '{team.team_name}' because it is referenced by completed matches."
            )
