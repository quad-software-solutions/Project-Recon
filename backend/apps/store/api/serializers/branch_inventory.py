from rest_framework import serializers

from apps.store.models import BranchInventory, Product


class ProductBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    sku = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    category_name = serializers.CharField(source="category.name")


class BranchInventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.SlugField(source="product.slug", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = BranchInventory
        fields = (
            "id",
            "branch",
            "branch_name",
            "product",
            "product_name",
            "product_slug",
            "product_sku",
            "quantity",
            "minimum_quantity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class BranchInventoryAdminSerializer(serializers.ModelSerializer):
    product_detail = ProductBriefSerializer(
        source="product", read_only=True
    )
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = BranchInventory
        fields = (
            "id",
            "branch",
            "branch_name",
            "product",
            "product_detail",
            "quantity",
            "minimum_quantity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class InventoryAdjustSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class InventoryCorrectSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class InventoryTransferSerializer(serializers.Serializer):
    from_branch = serializers.UUIDField()
    to_branch = serializers.UUIDField()
    product = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
