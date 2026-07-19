from rest_framework import serializers

from apps.cms.models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    """Public serializer — excludes is_active and server-side timestamps."""

    class Meta:
        model = Testimonial
        fields = (
            "id",
            "name",
            "role",
            "quote",
            "image",
            "video_url",
            "order",
        )
        read_only_fields = ("id",)


class TestimonialAdminSerializer(serializers.ModelSerializer):
    """Admin serializer — includes all fields."""

    class Meta:
        model = Testimonial
        fields = (
            "id",
            "name",
            "role",
            "quote",
            "image",
            "video_url",
            "is_active",
            "order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
