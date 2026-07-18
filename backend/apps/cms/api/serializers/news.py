from rest_framework import serializers

from apps.cms.models import NewsArticle


class NewsArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsArticle
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "image",
            "video_url",
            "button_text",
            "button_url",
            "type",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class NewsArticleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsArticle
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "image",
            "video_url",
            "button_text",
            "button_url",
            "type",
            "is_active",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
