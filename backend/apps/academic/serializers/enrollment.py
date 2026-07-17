from rest_framework import serializers

from apps.academic.constants import ClassType, PaymentMethod
from apps.academic.models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True)
    class_name = serializers.CharField(source="enrolled_class.name", read_only=True)
    class_type = serializers.CharField(source="enrolled_class.class_type", read_only=True)
    sub_program_name = serializers.CharField(source="enrolled_class.sub_program.name", read_only=True)
    program_name = serializers.CharField(source="enrolled_class.sub_program.program.name", read_only=True)
    branch_name = serializers.CharField(source="enrolled_class.branch.name", read_only=True)
    payment_status = serializers.CharField(source="payment.status", read_only=True, allow_null=True)
    payment_method = serializers.CharField(source="payment.payment_method", read_only=True, allow_null=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "enrolled_class",
            "class_name",
            "class_type",
            "sub_program_name",
            "program_name",
            "branch_name",
            "enrolled_at",
            "status",
            "enrollment_number",
            "pending_code",
            "verification_status",
            "rejection_reason",
            "payment_status",
            "payment_method",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "enrolled_at", "created_at", "updated_at",
            "student_name", "student_email", "class_name", "class_type",
            "sub_program_name", "program_name", "branch_name",
            "payment_status", "payment_method",
            "enrollment_number", "pending_code", "verification_status",
            "rejection_reason",
        ]


class EnrollmentListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True)
    class_name = serializers.CharField(source="enrolled_class.name", read_only=True)
    sub_program_name = serializers.CharField(source="enrolled_class.sub_program.name", read_only=True)
    payment_status = serializers.CharField(source="payment.status", read_only=True, allow_null=True)
    payment_method = serializers.CharField(source="payment.payment_method", read_only=True, allow_null=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "enrolled_class",
            "class_name",
            "sub_program_name",
            "enrolled_at",
            "status",
            "enrollment_number",
            "pending_code",
            "verification_status",
            "rejection_reason",
            "payment_status",
            "payment_method",
            "remarks",
        ]


class EnrollStudentSerializer(serializers.Serializer):
    student = serializers.UUIDField()
    enrolled_class = serializers.UUIDField()
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class OnlineEnrollmentSerializer(serializers.Serializer):
    enrolled_class = serializers.UUIDField(required=False)
    sub_program = serializers.UUIDField(required=False)
    class_type = serializers.ChoiceField(choices=ClassType.choices, required=False)
    branch = serializers.UUIDField(required=False)

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    password = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_null=True, allow_blank=True)
    guardian_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    guardian_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    guardian_email = serializers.EmailField(required=False, allow_blank=True, default="")

    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    transaction_reference = serializers.CharField(required=False, allow_blank=True, default="")
    bank_name = serializers.CharField(required=False, allow_blank=True, default="")
    transfer_reference = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)

    def validate(self, data):
        if not data.get("enrolled_class"):
            if not all([data.get("sub_program"), data.get("class_type"), data.get("branch")]):
                raise serializers.ValidationError(
                    "Provide enrolled_class, or sub_program + class_type + branch."
                )

        method = data.get("payment_method")
        tx_ref = data.get("transaction_reference", "")
        attachment = data.get("attachment")
        if method != PaymentMethod.CASH and not tx_ref and not attachment:
            raise serializers.ValidationError(
                "At least a transaction reference or payment attachment "
                "is required for non-cash payments."
            )
        return data
