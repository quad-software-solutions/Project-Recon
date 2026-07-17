from rest_framework import serializers

from apps.store.constants import PaymentMethod, PaymentStatus
from apps.store.models.payment import StorePayment


class PaymentEvidenceSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    transaction_reference = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    bank_name = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    attachment = serializers.FileField(required=False, allow_null=True)


class StorePaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    pending_order_total = serializers.DecimalField(
        source="pending_order.total", max_digits=10, decimal_places=2, read_only=True
    )
    verified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StorePayment
        fields = [
            "id",
            "pending_order",
            "pending_order_total",
            "amount",
            "payment_method",
            "payment_method_display",
            "transaction_reference",
            "bank_name",
            "attachment",
            "status",
            "status_display",
            "payment_date",
            "verified_by",
            "verified_by_name",
            "verified_at",
            "verification_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "pending_order",
            "amount",
            "payment_method",
            "transaction_reference",
            "bank_name",
            "attachment",
            "status",
            "payment_date",
            "verified_by",
            "verified_at",
            "verification_notes",
            "created_at",
            "updated_at",
        ]

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.full_name or obj.verified_by.email
        return None


class PaymentVerifySerializer(serializers.Serializer):
    verification_notes = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


class PaymentRejectSerializer(serializers.Serializer):
    verification_notes = serializers.CharField()


class PaymentCashSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_date = serializers.DateTimeField(required=False, allow_null=True)
