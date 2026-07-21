import os
import uuid

from django.core.exceptions import ValidationError
from django.db import models

from apps.academic.constants import DurationUnit
from apps.shared.validators import sanitize_filename, UploadedFileValidator


def sub_program_image_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    return f"sub_program_images/{uuid.uuid4().hex}{ext}"


class SubProgram(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(
        "academic.Program", on_delete=models.PROTECT, related_name="sub_programs"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, db_index=True)
    description = models.TextField(blank=True, default="")
    duration = models.PositiveIntegerField(null=True, blank=True)
    duration_unit = models.CharField(
        max_length=10, choices=DurationUnit.choices, null=True, blank=True
    )
    image = models.ImageField(
        upload_to=sub_program_image_upload_to, null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    group_fee = models.DecimalField(max_digits=10, decimal_places=2)
    individual_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
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

    def clean(self):
        if self.group_fee < 0:
            raise ValidationError({"group_fee": "Fee cannot be negative."})
        if self.individual_fee is not None and self.individual_fee < 0:
            raise ValidationError({"individual_fee": "Fee cannot be negative."})

    def __str__(self):
        return f"{self.program.name} - {self.name}"
