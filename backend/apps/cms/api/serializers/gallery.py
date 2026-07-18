"""Serializers for the Gallery model.

Provides a public read-only serializer and an admin serializer for CRUD
operations, following the established CMS pattern.
"""

from rest_framework import serializers
from apps.cms.models import Gallery


class GallerySerializer(serializers.ModelSerializer):
    """Public serializer — exposes all fields as read-only."""

    class Meta:
        model = Gallery
        fields = (
            "id",
            "title",
            "description",
            "image",
            "video_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class GalleryAdminSerializer(serializers.ModelSerializer):
    """Admin serializer — allows full CRUD on gallery items."""

    class Meta:
        model = Gallery
        fields = (
            "id",
            "title",
            "description",
            "image",
            "video_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        image = attrs.get("image")
        video_url = attrs.get("video_url")
        if image and video_url:
            raise serializers.ValidationError(
                "Only one of image or video_url may be provided, not both."
            )
        return attrs
