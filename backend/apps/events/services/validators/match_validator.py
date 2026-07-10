from rest_framework.exceptions import ValidationError

from apps.events.constants import MatchStatus
from apps.events.models import MatchParticipant


class MatchValidator:
    """
    Reusable business validation for Match operations.
    """

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
            raise ValidationError("Cannot modify matches in a closed tournament.")

    @staticmethod
    def validate_match_not_completed(match):
        """
        Ensure the match is not in a final state (COMPLETED or CANCELLED).

        Args:
            match: Match instance.

        Raises:
            ValidationError: If match is already completed or cancelled.
        """
        if match.status in (MatchStatus.COMPLETED, MatchStatus.CANCELLED):
            raise ValidationError(
                f"Cannot modify a match with status '{match.status}'."
            )

    @staticmethod
    def validate_team_belongs_to_tournament(team, match):
        """
        Ensure the team belongs to the same tournament as the match.

        Args:
            team: TournamentTeam instance.
            match: Match instance.

        Raises:
            ValidationError: If team belongs to a different tournament.
        """
        if team.tournament_id != match.tournament_id:
            raise ValidationError(
                "Team does not belong to the same tournament as the match."
            )

    @staticmethod
    def validate_team_not_duplicate_in_match(match, team):
        """
        Ensure the team is not already assigned to either side of the match.

        Args:
            match: Match instance.
            team: TournamentTeam instance.

        Raises:
            ValidationError: If team is already in the match.
        """
        exists = MatchParticipant.objects.filter(
            match_side__match=match,
            tournament_team=team,
        ).exists()
        if exists:
            raise ValidationError(
                f"Team '{team.team_name}' is already assigned to this match."
            )

    @staticmethod
    def validate_scores_non_negative(score):
        """
        Ensure a score value is not negative.

        Args:
            score: Integer score value.

        Raises:
            ValidationError: If score is negative.
        """
        if score < 0:
            raise ValidationError("Score cannot be negative.")

    @staticmethod
    def validate_both_sides_have_teams(match):
        """
        Ensure both sides of the match have at least one team assigned.

        Args:
            match: Match instance.

        Raises:
            ValidationError: If either side has no participants.
        """
        from django.db.models import Count

        sides = match.sides.annotate(team_count=Count("participants"))
        for side in sides:
            if side.team_count == 0:
                raise ValidationError(
                    f"Cannot complete match: {side.side} has no teams assigned."
                )

    @staticmethod
    def validate_team_not_in_completed_match(team):
        """
        Ensure the team is not a participant in any completed match.

        Args:
            team: TournamentTeam instance.

        Raises:
            ValidationError: If team is in a completed match.
        """
        from apps.events.constants import MatchStatus

        exists = MatchParticipant.objects.filter(
            tournament_team=team,
            match_side__match__status=MatchStatus.COMPLETED,
        ).exists()
        if exists:
            raise ValidationError(
                f"Cannot delete team '{team.team_name}' because it is referenced by completed matches."
            )
