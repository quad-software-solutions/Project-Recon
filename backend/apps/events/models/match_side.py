import uuid

from django.db import models

from apps.events.constants import MatchSideType


class MatchSide(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey(
        "events.Match",
        on_delete=models.CASCADE,
        related_name="sides",
    )
    side = models.CharField(
        max_length=20,
        choices=MatchSideType.choices,
    )
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_match_side"
        ordering = ["side"]
        constraints = [
            models.UniqueConstraint(
                fields=["match", "side"],
                name="uq_match_side",
            )
        ]

    def __str__(self):
        return f"{self.side} ({self.score})"
