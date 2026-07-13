from rest_framework import serializers

from apps.store.models.payment import StorePayment


class StorePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorePayment
        fields = [
            "id",
            "pending_order",
            "amount",
            "payment_method",
            "payment_provider",
            "transaction_reference",
            "status",
            "payment_date",
            "created_at",
        ]
        read_only_fields = [
            "id", "amount", "payment_method", "payment_provider",
            "transaction_reference", "status", "payment_date", "created_at",
        ]


class PaymentVerifySerializer(serializers.Serializer):
    reference = serializers.CharField()
