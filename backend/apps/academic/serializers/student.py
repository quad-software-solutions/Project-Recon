from rest_framework import serializers

from apps.academic.models import Student


class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "branch",
            "branch_name",
            "date_joined",
            "guardian_name",
            "guardian_phone",
            "guardian_email",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at", "email", "first_name", "last_name", "phone_number", "branch_name"]


class StudentListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "email",
            "first_name",
            "last_name",
            "branch",
            "branch_name",
            "date_joined",
            "guardian_name",
            "guardian_phone",
            "guardian_email",
            "is_active",
            "created_at",
        ]


class StudentUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_null=True)
    email = serializers.EmailField(required=False)
    date_joined = serializers.DateField(required=False)
    branch = serializers.UUIDField(required=False)
    guardian_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    guardian_email = serializers.EmailField(required=False, allow_blank=True)
