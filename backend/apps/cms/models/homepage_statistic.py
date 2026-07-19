import uuid

from django.db import models


class HomepageStatistic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    future_engineers = models.PositiveIntegerField(
        default=5_000_000,
        help_text="Target number of future engineers",
    )
    programs = models.PositiveIntegerField(default=120, help_text="Number of programs")
    competitions = models.PositiveIntegerField(default=500, help_text="Number of competitions")
    mission_current = models.PositiveIntegerField(
        default=1_240_500,
        help_text="Current progress toward mission target",
    )
    mission_target = models.PositiveIntegerField(
        default=5_000_000,
        help_text="Mission target value",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "cms_homepage_statistic"
        verbose_name = "Homepage Statistic"
        verbose_name_plural = "Homepage Statistics"

    def __str__(self):
        return "Homepage Statistics"
