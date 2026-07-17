"""Gallery model for managing media gallery items.

Supports both photo uploads and video links for the CMS gallery.
"""

import uuid
from django.db import models


def gallery_upload_to(instance, filename):
    """Generate upload path for gallery images."""
    return f"cms/gallery/{uuid.uuid4().hex}/{filename}"


class Gallery(models.Model):
    """Represents a single gallery item — either a photo or a video link."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to=gallery_upload_to, null=True, blank=True)
    video_url = models.URLField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "cms_gallery"

    def __str__(self):
        return self.title
