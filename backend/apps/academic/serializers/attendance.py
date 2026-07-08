from rest_framework import serializers

from apps.academic.constants import AttendanceStatus
from apps.academic.models import AttendanceSession, AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField(read_only=True)
    enrollment_id = serializers.UUIDField(source="enrollment.id", read_only=True)
    enrollment = serializers.UUIDField(write_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "attendance_session",
            "enrollment",
            "enrollment_id",
            "student_name",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "attendance_session", "created_at", "updated_at",
            "enrollment_id", "student_name",
        ]

    def get_student_name(self, obj):
        return obj.enrollment.student.user.full_name


class AttendanceSessionSerializer(serializers.ModelSerializer):
    enrolled_class = serializers.UUIDField(required=True)
    class_name = serializers.CharField(source="enrolled_class.name", read_only=True)
    branch_name = serializers.CharField(source="enrolled_class.branch.name", read_only=True)
    recorded_by_name = serializers.SerializerMethodField(read_only=True)
    recorded_by = serializers.UUIDField(read_only=True, source="recorded_by.id")
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            "id",
            "enrolled_class",
            "class_name",
            "branch_name",
            "session_date",
            "topic",
            "recorded_by",
            "recorded_by_name",
            "records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "recorded_by_name",
            "records", "created_at", "updated_at",
            "class_name", "branch_name",
        ]

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.full_name


class AttendanceSessionListSerializer(serializers.ModelSerializer):
    enrolled_class = serializers.UUIDField(read_only=True)
    class_name = serializers.CharField(source="enrolled_class.name", read_only=True)
    branch_name = serializers.CharField(source="enrolled_class.branch.name", read_only=True)
    recorded_by_name = serializers.SerializerMethodField(read_only=True)
    record_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            "id",
            "enrolled_class",
            "class_name",
            "branch_name",
            "session_date",
            "topic",
            "recorded_by_name",
            "record_count",
            "created_at",
        ]

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.full_name

    def get_record_count(self, obj):
        return obj.records.count()


class AttendanceRecordBulkSerializer(serializers.Serializer):
    enrollment = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class AttendanceSummarySerializer(serializers.Serializer):
    present = serializers.IntegerField(read_only=True)
    absent = serializers.IntegerField(read_only=True)
    late = serializers.IntegerField(read_only=True)
    excused = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
