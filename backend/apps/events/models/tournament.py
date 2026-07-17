import uuid

from django.db import models


class Tournament(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.OneToOneField(
        "events.Event",
        on_delete=models.PROTECT,
        related_name="tournament",
    )
    category = models.ForeignKey(
        "events.TournamentCategory",
        on_delete=models.PROTECT,
        related_name="tournaments",
    )
    max_teams = models.PositiveIntegerField(null=True, blank=True)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_closed = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_tournament"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event.title} ({self.category.name})"
