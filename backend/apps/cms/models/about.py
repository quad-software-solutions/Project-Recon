import uuid

from django.db import models

from apps.shared.validators import UploadedFileValidator


def about_upload_to(instance, filename):
    return f"cms/about/{uuid.uuid4().hex}/{filename}"


class AboutUs(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    description = models.TextField()
    image = models.ImageField(
        upload_to=about_upload_to, null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    mission = models.TextField(blank=True, default="")
    vision = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        db_table = "cms_about_us"

    def __str__(self):
        return self.title
