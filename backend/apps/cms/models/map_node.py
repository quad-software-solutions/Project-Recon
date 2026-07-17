"""MapNode model for the Journey Map feature.

Stores individual map nodes representing locations with achievements,
used to render the interactive journey map on the public site.
"""

import uuid

from django.db import models

from apps.cms.constants import MapNodeCategory


def map_node_upload_to(instance, filename):
    """Generate upload path for map node images."""
    return f"cms/map_nodes/{uuid.uuid4().hex}/{filename}"


class MapNode(models.Model):
    """A location node on the journey map.

    Each node represents a geographic location tied to a championship,
    academic milestone, research effort, strategic partnership, or
    alliance achievement.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city = models.CharField(max_length=200)
    country = models.CharField(max_length=200)
    title = models.CharField(max_length=300)
    achievement = models.TextField()
    x = models.FloatField(help_text="Map position as percentage (0–100)")
    y = models.FloatField(help_text="Map position as percentage (0–100)")
    lat = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text='e.g. "8.9806\u00b0 N"',
    )
    lng = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text='e.g. "38.7578\u00b0 E"',
    )
    image = models.ImageField(
        upload_to=map_node_upload_to,
        null=True,
        blank=True,
    )
    category = models.CharField(
        max_length=20,
        choices=MapNodeCategory.choices,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        db_table = "cms_map_node"

    def __str__(self):
        return self.title
