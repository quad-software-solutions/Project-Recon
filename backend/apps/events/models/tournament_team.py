import uuid

from django.db import models


class TournamentTeam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(
        "events.Tournament",
        on_delete=models.PROTECT,
        related_name="teams",
    )
    team_name = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, null=True, blank=True)
    coach_name = models.CharField(max_length=255, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=50, null=True, blank=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_tournament_team"
        ordering = ["team_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tournament", "team_name"],
                name="uq_tournament_team_name",
            )
        ]
        indexes = [
            models.Index(fields=["tournament"]),
        ]

    def __str__(self):
        return f"{self.team_name} ({self.tournament.event.title})"
