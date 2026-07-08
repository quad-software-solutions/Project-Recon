from rest_framework import serializers

from apps.academic.models import EnrollmentPeriod


class EnrollmentPeriodSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    program_name = serializers.CharField(source="program.name", read_only=True)
    sub_program_name = serializers.CharField(source="sub_program.name", read_only=True)

    class Meta:
        model = EnrollmentPeriod
        fields = [
            "id",
            "branch",
            "branch_name",
            "program",
            "program_name",
            "sub_program",
            "sub_program_name",
            "class_type",
            "class_period",
            "title",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "branch_name", "program_name", "sub_program_name"]


class EnrollmentPeriodListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    program_name = serializers.CharField(source="program.name", read_only=True)
    sub_program_name = serializers.CharField(source="sub_program.name", read_only=True)

    class Meta:
        model = EnrollmentPeriod
        fields = [
            "id",
            "branch",
            "branch_name",
            "program",
            "program_name",
            "sub_program",
            "sub_program_name",
            "class_type",
            "class_period",
            "title",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
        ]
