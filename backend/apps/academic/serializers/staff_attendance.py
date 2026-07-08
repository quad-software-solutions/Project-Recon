from rest_framework import serializers

from apps.academic.models import StaffAttendanceSession, StaffAttendanceRecord
from apps.academic.constants import AttendanceStatus


class StaffAttendanceRecordSerializer(serializers.ModelSerializer):
    staff_member_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StaffAttendanceRecord
        fields = [
            "id",
            "session",
            "staff_member",
            "staff_member_name",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "session", "created_at", "updated_at", "staff_member_name"]

    def get_staff_member_name(self, obj):
        return obj.staff_member.full_name


class StaffAttendanceSessionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    records = StaffAttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = StaffAttendanceSession
        fields = [
            "id",
            "branch",
            "branch_name",
            "date",
            "status",
            "notes",
            "created_by",
            "created_by_name",
            "records",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "status", "created_by", "created_by_name",
            "records", "is_active", "created_at", "updated_at", "branch_name",
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.full_name


class StaffAttendanceSessionListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    record_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StaffAttendanceSession
        fields = [
            "id",
            "branch",
            "branch_name",
            "date",
            "status",
            "notes",
            "created_by_name",
            "record_count",
            "is_active",
            "created_at",
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.full_name

    def get_record_count(self, obj):
        return obj.records.count()


class StaffAttendanceRecordUpsertSerializer(serializers.Serializer):
    staff_member = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class AvailableStaffSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)
    email = serializers.EmailField(read_only=True)

    def get_full_name(self, obj):
        return obj.full_name


class PublishSessionSerializer(serializers.Serializer):
    pass
