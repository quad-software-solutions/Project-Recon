from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.academic.models import Class


class ClassSerializer(serializers.ModelSerializer):
    sub_program_name = serializers.CharField(source="sub_program.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "branch",
            "branch_name",
            "instructor",
            "instructor_name",
            "name",
            "class_type",
            "class_period",
            "capacity",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "sub_program_name", "branch_name", "instructor_name"]

    @extend_schema_field(serializers.CharField())
    def get_instructor_name(self, obj):
        return obj.instructor.full_name if hasattr(obj.instructor, "full_name") else f"{obj.instructor.first_name} {obj.instructor.last_name}"


class ClassListSerializer(serializers.ModelSerializer):
    sub_program_name = serializers.CharField(source="sub_program.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "branch",
            "branch_name",
            "instructor",
            "instructor_name",
            "name",
            "class_type",
            "class_period",
            "capacity",
            "is_active",
            "created_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_instructor_name(self, obj):
        return obj.instructor.full_name if hasattr(obj.instructor, "full_name") else f"{obj.instructor.first_name} {obj.instructor.last_name}"


class AssignInstructorSerializer(serializers.Serializer):
    instructor = serializers.UUIDField()
