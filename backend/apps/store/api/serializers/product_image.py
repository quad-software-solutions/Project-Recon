import os

from rest_framework import serializers

from apps.store.models import ProductImage

_ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_MAX_IMAGE_SIZE = 5 * 1024 * 1024


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

    def validate_image(self, value):
        if value.size > _MAX_IMAGE_SIZE:
            raise serializers.ValidationError("Image must be less than 5MB.")
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in _ALLOWED_IMAGE_EXTS:
            raise serializers.ValidationError(
                f"Unsupported file extension '{ext}'. "
                f"Allowed: {', '.join(sorted(_ALLOWED_IMAGE_EXTS))}"
            )
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in _ALLOWED_IMAGE_MIMES:
            raise serializers.ValidationError(
                f"Unsupported file type '{content_type}'. "
                f"Allowed: {', '.join(sorted(_ALLOWED_IMAGE_MIMES))}"
            )
        return value


class ImageReorderSerializer(serializers.Serializer):
    ordered_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
