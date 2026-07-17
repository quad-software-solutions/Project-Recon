from rest_framework import serializers

from apps.academic.constants import PaymentMethod
from apps.academic.models import EnrollmentPayment


class EnrollmentPaymentSerializer(serializers.ModelSerializer):
    enrollment_id = serializers.UUIDField(source="enrollment.id", read_only=True)
    student_name = serializers.CharField(source="enrollment.student.user.full_name", read_only=True)
    class_name = serializers.CharField(source="enrollment.enrolled_class.name", read_only=True)
    sub_program_name = serializers.CharField(source="enrollment.enrolled_class.sub_program.name", read_only=True)

    class Meta:
        model = EnrollmentPayment
        fields = [
            "id",
            "enrollment",
            "enrollment_id",
            "student_name",
            "class_name",
            "sub_program_name",
            "amount",
            "payment_method",
            "transaction_reference",
            "bank_name",
            "transfer_reference",
            "payment_date",
            "status",
            "verified_by",
            "verified_at",
            "verification_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "enrollment_id", "student_name", "class_name", "sub_program_name",
            "verified_by", "verified_at",
        ]


class EnrollmentPaymentListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="enrollment.student.user.full_name", read_only=True)
    class_name = serializers.CharField(source="enrollment.enrolled_class.name", read_only=True)

    class Meta:
        model = EnrollmentPayment
        fields = [
            "id",
            "enrollment",
            "student_name",
            "class_name",
            "amount",
            "payment_method",
            "transaction_reference",
            "bank_name",
            "transfer_reference",
            "status",
            "payment_date",
            "verification_notes",
            "created_at",
        ]


class PaymentSerializer(serializers.Serializer):
    enrollment = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    payment_date = serializers.DateTimeField(required=False, allow_null=True)
    transaction_reference = serializers.CharField(required=False, allow_blank=True, default="")
    bank_name = serializers.CharField(required=False, allow_blank=True, default="")
    transfer_reference = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)
    verification_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        method = data.get("payment_method")
        tx_ref = data.get("transaction_reference", "")
        attachment = data.get("attachment")
        if method != PaymentMethod.CASH and not tx_ref and not attachment:
            raise serializers.ValidationError(
                "At least a transaction reference or payment attachment "
                "is required for non-cash payments."
            )
        return data


class RejectionSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(max_length=500)


class MoveEnrollmentSerializer(serializers.Serializer):
    target_class = serializers.UUIDField()


class BulkMoveEnrollmentSerializer(serializers.Serializer):
    target_class = serializers.UUIDField()
    enrollment_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
    count = serializers.IntegerField(min_value=1, required=False)

    def validate(self, data):
        if not data.get("enrollment_ids") and not data.get("count"):
            raise serializers.ValidationError(
                "Provide either enrollment_ids or count."
            )
        if data.get("enrollment_ids") and data.get("count"):
            raise serializers.ValidationError(
                "Provide either enrollment_ids or count, not both."
            )
        return data
