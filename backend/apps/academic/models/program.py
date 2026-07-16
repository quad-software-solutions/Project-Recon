import uuid

from django.db import models


class Program(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="program_images/", null=True, blank=True)
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
        self.clean()
        super().save(*args, **kwargs)
