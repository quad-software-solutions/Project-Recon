from rest_framework import serializers

from apps.cms.models import AboutUs


class AboutUsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutUs
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "image",
            "mission",
            "vision",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AboutUsAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutUs
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "image",
            "mission",
            "vision",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
