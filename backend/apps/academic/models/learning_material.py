import os
import uuid

from django.db import models

from apps.academic.constants import MaterialType
from apps.shared.validators import sanitize_filename, UploadedFileValidator


def learning_material_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    unique = f"{uuid.uuid4().hex}{ext}"
    return f"academic/learning_materials/{instance.sub_program_id}/{unique}"


class LearningMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_program = models.ForeignKey(
        "academic.SubProgram",
        on_delete=models.PROTECT,
        related_name="learning_materials",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    file = models.FileField(
        upload_to=learning_material_upload_to,
        validators=[UploadedFileValidator()],
    )
    material_type = models.CharField(
        max_length=10, choices=MaterialType.choices, editable=False,
    )
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="uploaded_materials"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Learning Material"
        verbose_name_plural = "Learning Materials"
        indexes = [
            models.Index(fields=["sub_program"]),
            models.Index(fields=["uploaded_by"]),
            models.Index(fields=["material_type"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.sub_program.name})"
