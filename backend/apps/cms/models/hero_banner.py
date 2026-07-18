import uuid

from django.db import models

from apps.shared.validators import HttpsUrlValidator, UploadedFileValidator


def hero_banner_upload_to(instance, filename):
    return f"cms/hero_banners/{uuid.uuid4().hex}/{filename}"


class HeroBanner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True, default="")
    description = models.TextField(blank=True, default="")
    image = models.ImageField(
        upload_to=hero_banner_upload_to, null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    video_url = models.URLField(
        max_length=500, null=True, blank=True,
        validators=[HttpsUrlValidator()],
    )
    button_text = models.CharField(max_length=100, null=True, blank=True)
    button_url = models.URLField(
        max_length=500, null=True, blank=True,
        validators=[HttpsUrlValidator()],
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "cms_hero_banner"

    def __str__(self):
        return self.title
