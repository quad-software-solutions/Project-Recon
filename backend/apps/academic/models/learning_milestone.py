import uuid

from django.db import models


class LearningMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_program = models.ForeignKey(
        "academic.SubProgram", on_delete=models.PROTECT, related_name="milestones"
    )
    scope_class = models.ForeignKey(
        "academic.Class",
        on_delete=models.PROTECT,
        related_name="milestones",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "Learning Milestone"
        verbose_name_plural = "Learning Milestones"
        constraints = [
            models.UniqueConstraint(
                fields=["sub_program", "scope_class", "title"],
                name="unique_milestone_per_scope",
            )
        ]

    def __str__(self):
        scope = f" (Shared)" if self.scope_class is None else f" ({self.scope_class.name})"
        return f"{self.sub_program.name} - {self.title}{scope}"
