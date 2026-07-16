from rest_framework import serializers

from apps.events.models import EventPayment


class EventPaymentSerializer(serializers.ModelSerializer):
    registration_id = serializers.UUIDField(source="registration.id", read_only=True)
    event_title = serializers.CharField(source="registration.event.title", read_only=True)
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(
        source="registration.student.user.email", read_only=True, default=None
    )
    verified_by_name = serializers.SerializerMethodField()
    verified_by_email = serializers.EmailField(
        source="verified_by.email", read_only=True, default=None
    )

    class Meta:
        model = EventPayment
        fields = [
            "id",
            "registration",
            "registration_id",
            "event_title",
            "student_name",
            "student_email",
            "amount",
            "payment_method",
            "transaction_reference",
            "bank_name",
            "attachment",
            "status",
            "payment_date",
            "verified_by",
            "verified_by_name",
            "verified_by_email",
            "verified_at",
            "verification_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "status", "payment_date", "verified_by",
            "verified_at", "verification_notes", "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        if obj.registration.student:
            user = obj.registration.student.user
            name = f"{user.first_name} {user.last_name}".strip()
            return name or user.email
        return obj.registration.public_full_name

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            name = f"{obj.verified_by.first_name} {obj.verified_by.last_name}".strip()
            return name or obj.verified_by.email
        return None


class PaymentEvidenceSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(
        choices=["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE"]
    )
    transaction_reference = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    bank_name = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )
    attachment = serializers.FileField(required=False, allow_null=True)


class CashPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_date = serializers.DateTimeField(required=False, allow_null=True)


class PaymentVerifySerializer(serializers.Serializer):
    verification_notes = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


class PaymentRejectSerializer(serializers.Serializer):
    verification_notes = serializers.CharField()
