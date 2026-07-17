from rest_framework import serializers

from apps.events.models import Workshop


class WorkshopSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Workshop
        fields = [
            "id",
            "event_title",
            "instructor_name",
            "duration_minutes",
            "level",
            "price",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_instructor_name(self, obj):
        return f"{obj.instructor.first_name} {obj.instructor.last_name}".strip() or obj.instructor.email


class WorkshopAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    instructor_name = serializers.SerializerMethodField()
    instructor_email = serializers.EmailField(source="instructor.email", read_only=True)

    class Meta:
        model = Workshop
        fields = [
            "id",
            "event",
            "event_title",
            "instructor",
            "instructor_name",
            "instructor_email",
            "duration_minutes",
            "level",
            "price",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_instructor_name(self, obj):
        return f"{obj.instructor.first_name} {obj.instructor.last_name}".strip() or obj.instructor.email
