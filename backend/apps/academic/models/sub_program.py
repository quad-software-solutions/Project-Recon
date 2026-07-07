import uuid

from django.db import models

from apps.academic.constants import DurationUnit


class SubProgram(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(
        "academic.Program", on_delete=models.PROTECT, related_name="sub_programs"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    duration = models.PositiveIntegerField(null=True, blank=True)
    duration_unit = models.CharField(
        max_length=10, choices=DurationUnit.choices, null=True, blank=True
    )
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Sub Program"
        verbose_name_plural = "Sub Programs"
        constraints = [
            models.UniqueConstraint(fields=["program", "name"], name="unique_sub_program_per_program"),
            models.UniqueConstraint(fields=["program", "slug"], name="unique_sub_program_slug_per_program"),
        ]

    def __str__(self):
        return f"{self.program.name} - {self.name}"
