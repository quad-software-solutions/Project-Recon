"""Serializers for the MapNode model.

Provides a public serializer for unauthenticated access and an admin
serializer for CMS staff CRUD operations.
"""

from rest_framework import serializers

from apps.cms.models import MapNode


class MapNodeSerializer(serializers.ModelSerializer):
    """Public serializer for map nodes (read-only for end users)."""

    class Meta:
        model = MapNode
        fields = (
            "id",
            "city",
            "country",
            "title",
            "achievement",
            "x",
            "y",
            "lat",
            "lng",
            "image",
            "category",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class MapNodeAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for full CRUD on map nodes."""

    class Meta:
        model = MapNode
        fields = (
            "id",
            "city",
            "country",
            "title",
            "achievement",
            "x",
            "y",
            "lat",
            "lng",
            "image",
            "category",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
