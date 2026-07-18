from rest_framework import serializers

from apps.cms.models import Partner


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = (
            "id",
            "title",
            "description",
            "image",
            "website_url",
            "type",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PartnerAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = (
            "id",
            "title",
            "description",
            "image",
            "website_url",
            "type",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
