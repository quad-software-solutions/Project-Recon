from rest_framework import serializers

from apps.store.models.shopping_cart import ShoppingCart, ShoppingCartItem


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingCartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_slug",
            "product_price",
            "branch",
            "branch_name",
            "quantity",
            "subtotal",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_subtotal(self, obj):
        return float(obj.product.price) * obj.quantity


class ShoppingCartSerializer(serializers.ModelSerializer):
    items = ShoppingCartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingCart
        fields = [
            "id",
            "items",
            "total",
            "item_count",
            "expires_at",
            "created_at",
            "updated_at",
        ]

    def get_total(self, obj):
        total = 0
        for item in obj.items.all():
            total += float(item.product.price) * item.quantity
        return total

    def get_item_count(self, obj):
        return obj.items.count()


class CartAddItemSerializer(serializers.Serializer):
    product = serializers.UUIDField()
    branch = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class CartUpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
