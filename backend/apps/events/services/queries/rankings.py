from apps.events.models import TournamentTeam


class RankingsQuery:
    """
    Returns calculated Tournament standings.
    """

    @staticmethod
    def execute(tournament_id, top_n=None):
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
