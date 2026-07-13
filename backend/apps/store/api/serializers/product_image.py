from rest_framework import serializers

from apps.store.models import ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = (
            "id",
            "product",
            "image",
            "alt_text",
            "is_primary",
            "display_order",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class ProductImageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = (
            "id",
            "product",
            "image",
            "alt_text",
            "is_primary",
            "display_order",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class ImageReorderSerializer(serializers.Serializer):
    ordered_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
