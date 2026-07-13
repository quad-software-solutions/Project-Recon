from rest_framework import serializers

from apps.store.models import ProductCategory


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ProductCategory
        fields = (
            "id",
            "name",
            "description",
            "is_active",
            "product_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "product_count", "created_at", "updated_at")


class CategoryAdminSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ProductCategory
        fields = (
            "id",
            "name",
            "description",
            "is_active",
            "product_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "product_count", "created_at", "updated_at")
