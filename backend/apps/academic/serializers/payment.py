from rest_framework import serializers

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
            "payment_provider",
            "transaction_reference",
            "payment_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "enrollment_id", "student_name", "class_name", "sub_program_name",
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
            "status",
            "payment_date",
            "created_at",
        ]


class CashPaymentSerializer(serializers.Serializer):
    enrollment = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_date = serializers.DateTimeField(required=False)


class OnlinePaymentVerifySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=255)
