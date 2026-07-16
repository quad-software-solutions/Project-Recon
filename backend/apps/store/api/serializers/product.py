from rest_framework import serializers

from apps.store.models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "display_order", "created_at")
        read_only_fields = ("id", "created_at")


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "short_description",
            "description",
            "sku",
            "barcode",
            "price",
            "weight",
            "is_active",
            "images",
            "primary_image",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if img:
            return ProductImageSerializer(img, context=self.context).data
        return None


class ProductAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "short_description",
            "description",
            "sku",
            "barcode",
            "price",
            "weight",
            "is_active",
            "archived_at",
            "images",
            "primary_image",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "archived_at", "created_at", "updated_at")

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if img:
            return ProductImageSerializer(img, context=self.context).data
        return None
