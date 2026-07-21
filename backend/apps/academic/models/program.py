import os
import uuid

from django.db import models

from apps.shared.validators import sanitize_filename, UploadedFileValidator


def program_image_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    return f"program_images/{uuid.uuid4().hex}{ext}"


class Program(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    image = models.ImageField(
        upload_to=program_image_upload_to, null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    supports_group = models.BooleanField(default=True)
    supports_individual = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Program"
        verbose_name_plural = "Programs"

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError

        if not self.supports_group and not self.supports_individual:
            raise ValidationError("At least one learning type must be enabled.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
