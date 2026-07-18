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

    def validate(self, attrs):
        image = attrs.get("image")
        video_url = attrs.get("video_url")
        button_text = attrs.get("button_text")
        button_url = attrs.get("button_url")
        if image and video_url:
            raise serializers.ValidationError(
                "Only one of image or video_url may be provided, not both."
            )
        if button_text and not button_url:
            raise serializers.ValidationError(
                "button_url is required when button_text is provided."
            )
        if button_url and not button_text:
            raise serializers.ValidationError(
                "button_text is required when button_url is provided."
            )
        return attrs
