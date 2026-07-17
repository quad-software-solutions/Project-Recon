import uuid

from django.db import models


class MatchParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match_side = models.ForeignKey(
        "events.MatchSide",
        on_delete=models.CASCADE,
        related_name="participants",
    )
    tournament_team = models.ForeignKey(
        "events.TournamentTeam",
        on_delete=models.PROTECT,
        related_name="match_participants",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "events_match_participant"
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["match_side", "tournament_team"],
                name="uq_match_side_team",
            )
        ]
        indexes = []

    def __str__(self):
        return f"{self.tournament_team.team_name} in {self.match_side.side}"
