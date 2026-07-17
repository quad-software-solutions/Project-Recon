import uuid

from django.db import models

from apps.events.constants import WorkshopLevel


class Workshop(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.OneToOneField(
        "events.Event",
        on_delete=models.PROTECT,
        related_name="workshop",
    )
    instructor = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="workshops",
    )
    duration_minutes = models.PositiveIntegerField()
    level = models.CharField(
        max_length=20,
        choices=WorkshopLevel.choices,
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_workshop"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event.title} ({self.level})"
