import os

from rest_framework import serializers

from apps.store.constants import PaymentMethod, PaymentStatus
from apps.store.models.payment import StorePayment

_ALLOWED_ATTACHMENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
_ALLOWED_ATTACHMENT_EXTS = {".pdf", ".jpg", ".jpeg", ".png"}
_MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024


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

    def validate_attachment(self, value):
        if value is None:
            return value
        if value.size > _MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError("Attachment must be less than 10MB.")
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in _ALLOWED_ATTACHMENT_EXTS:
            raise serializers.ValidationError(
                f"Unsupported file extension '{ext}'. "
                f"Allowed: {', '.join(sorted(_ALLOWED_ATTACHMENT_EXTS))}"
            )
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in _ALLOWED_ATTACHMENT_TYPES:
            raise serializers.ValidationError(
                f"Unsupported file type '{content_type}'. "
                f"Allowed: {', '.join(sorted(_ALLOWED_ATTACHMENT_TYPES))}"
            )
        return value

    def validate(self, attrs):
        if attrs.get("payment_method") != PaymentMethod.CASH:
            if not attrs.get("transaction_reference") and not attrs.get("attachment"):
                raise serializers.ValidationError(
                    "At least a transaction reference or payment attachment "
                    "is required for non-cash payments."
                )
        return attrs


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
