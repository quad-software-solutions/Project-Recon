from rest_framework import serializers

from apps.cms.models import HeroBanner


class HeroBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = (
            "id",
            "title",
            "subtitle",
            "description",
            "image",
            "video_url",
            "button_text",
            "button_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class HeroBannerAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = (
            "id",
            "title",
            "subtitle",
            "description",
            "image",
            "video_url",
            "button_text",
            "button_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
