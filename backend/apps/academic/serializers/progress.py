from rest_framework import serializers

from apps.academic.constants import ProgressStatus
from apps.academic.models import LearningMilestone, StudentProgress


class LearningMilestoneSerializer(serializers.ModelSerializer):
    sub_program = serializers.UUIDField(required=True)
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    scope_class = serializers.UUIDField(allow_null=True, required=False, default=None)
    scope_class_name = serializers.SerializerMethodField(read_only=True)
    scope = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LearningMilestone
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "scope_class",
            "scope_class_name",
            "scope",
            "title",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "is_active", "created_at", "updated_at",
            "sub_program_name", "scope_class_name", "scope",
        ]

    def get_scope_class_name(self, obj):
        return obj.scope_class.name if obj.scope_class else None

    def get_scope(self, obj):
        return "class_specific" if obj.scope_class else "shared"


class LearningMilestoneListSerializer(serializers.ModelSerializer):
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    scope_class_name = serializers.SerializerMethodField(read_only=True)
    scope = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LearningMilestone
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "scope_class",
            "scope_class_name",
            "scope",
            "title",
            "description",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id", "sub_program_name", "scope_class_name", "scope",
        ]

    def get_scope_class_name(self, obj):
        return obj.scope_class.name if obj.scope_class else None

    def get_scope(self, obj):
        return "class_specific" if obj.scope_class else "shared"


class CustomizeMilestoneSerializer(serializers.Serializer):
    target_class = serializers.UUIDField(required=True)


class StudentProgressSerializer(serializers.ModelSerializer):
    enrollment = serializers.UUIDField(required=True)
    milestone = serializers.UUIDField(required=True)
    milestone_title = serializers.CharField(
        source="milestone.title", read_only=True
    )
    student_name = serializers.SerializerMethodField(read_only=True)
    scope = serializers.SerializerMethodField(read_only=True)
    updated_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentProgress
        fields = [
            "id",
            "enrollment",
            "milestone",
            "milestone_title",
            "scope",
            "student_name",
            "status",
            "completed_at",
            "remarks",
            "updated_by",
            "updated_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "milestone_title", "student_name", "scope",
            "completed_at", "updated_by_name",
        ]

    def get_student_name(self, obj):
        return obj.enrollment.student.user.full_name

    def get_scope(self, obj):
        return "class_specific" if obj.milestone.scope_class else "shared"

    def get_updated_by_name(self, obj):
        return obj.updated_by.full_name


class RecordProgressSerializer(serializers.Serializer):
    enrollment = serializers.UUIDField(required=True)
    milestone = serializers.UUIDField(required=True)
    status = serializers.ChoiceField(
        choices=ProgressStatus.choices, default=ProgressStatus.NOT_STARTED
    )
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class UpdateProgressSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=ProgressStatus.choices, required=False
    )
    remarks = serializers.CharField(required=False, allow_blank=True)


class ProgressSummarySerializer(serializers.Serializer):
    not_started = serializers.IntegerField(read_only=True)
    in_progress = serializers.IntegerField(read_only=True)
    completed = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
