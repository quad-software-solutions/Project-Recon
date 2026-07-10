from rest_framework import serializers

from apps.events.models import EventRegistration


class PublicRegistrationSerializer(serializers.Serializer):
    public_full_name = serializers.CharField(max_length=255)
    public_email = serializers.EmailField()
    public_phone = serializers.CharField(max_length=50)
    public_organization = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)


class StudentRegistrationSerializer(serializers.Serializer):
    student = serializers.UUIDField(required=False)


class RegistrationAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True, default=None)
    student_name = serializers.SerializerMethodField()
    tournament = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "event",
            "event_title",
            "student",
            "student_email",
            "student_name",
            "public_full_name",
            "public_email",
            "public_phone",
            "public_organization",
            "registration_status",
            "payment_status",
            "registered_at",
            "approved_at",
            "cancelled_at",
            "tournament",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "registered_at", "approved_at", "cancelled_at",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        if obj.student:
            user = obj.student.user
            name = f"{user.first_name} {user.last_name}".strip()
            return name or user.email
        return None

    def get_tournament(self, obj):
        from apps.events.models import Tournament
        try:
            tournament = Tournament.objects.get(event=obj.event)
            return str(tournament.id)
        except Tournament.DoesNotExist:
            return None


class MyRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start = serializers.DateTimeField(source="event.start_datetime", read_only=True)
    event_end = serializers.DateTimeField(source="event.end_datetime", read_only=True)
    event_location = serializers.CharField(source="event.location", read_only=True)
    event_type = serializers.CharField(source="event.event_type", read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "event",
            "event_title",
            "event_start",
            "event_end",
            "event_location",
            "event_type",
            "registration_status",
            "payment_status",
            "registered_at",
        ]
        read_only_fields = fields
