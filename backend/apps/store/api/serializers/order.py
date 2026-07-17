from rest_framework import serializers

from apps.store.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "sku",
            "quantity", "unit_price", "subtotal",
        ]
        read_only_fields = fields


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = [
            "id", "previous_status", "new_status",
            "changed_by", "changed_at", "notes",
        ]
        read_only_fields = ["id", "changed_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "branch", "branch_name",
            "payment_reference", "subtotal", "total", "status",
            "paid_at", "completed_at", "created_at",
            "guest_name", "guest_email", "guest_phone",
            "items", "status_history",
        ]
        read_only_fields = [
            "id", "order_number", "subtotal", "total",
            "paid_at", "completed_at", "created_at",
            "items", "status_history",
        ]


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
