import uuid

from django.db import models

from apps.events.constants import MatchStatus


class Match(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(
        "events.Tournament",
        on_delete=models.CASCADE,
        related_name="matches",
    )
    round = models.CharField(max_length=100)
    scheduled_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    winning_side = models.ForeignKey(
        "events.MatchSide",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_matches",
    )
    status = models.CharField(
        max_length=20,
        choices=MatchStatus.choices,
        default=MatchStatus.SCHEDULED,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_match"
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(fields=["tournament", "round"]),
            models.Index(fields=["tournament", "status"]),
            models.Index(fields=["scheduled_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.tournament.event.title} - {self.round} ({self.status})"
