from rest_framework import serializers

from apps.store.constants import PaymentMethod
from apps.store.models.pending_order import PendingOrder, PendingOrderItem


class PendingOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    class Meta:
        model = PendingOrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_slug",
            "quantity",
            "unit_price",
            "subtotal",
        ]
        read_only_fields = ["id", "unit_price", "subtotal"]


class PendingOrderSerializer(serializers.ModelSerializer):
    items = PendingOrderItemSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = PendingOrder
        fields = [
            "id",
            "branch",
            "branch_name",
            "payment_reference",
            "subtotal",
            "total",
            "items",
            "guest_name",
            "guest_email",
            "guest_phone",
            "expires_at",
            "created_at",
        ]
        read_only_fields = [
            "id", "payment_reference", "subtotal", "total",
            "expires_at", "created_at",
        ]


class PaymentFieldSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    transaction_reference = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    bank_name = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )
        return value


class CheckoutInputSerializer(serializers.Serializer):
    branch = serializers.UUIDField()
    guest_name = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    guest_email = serializers.EmailField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    guest_phone = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default=""
    )
    payment = PaymentFieldSerializer(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get("request")
        if request and not request.user.is_authenticated:
            if not attrs.get("guest_name"):
                raise serializers.ValidationError(
                    "Guest name is required for guest checkout."
                )
            if not attrs.get("guest_email"):
                raise serializers.ValidationError(
                    "Guest email is required for guest checkout."
                )
        return attrs
