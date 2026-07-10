from rest_framework import serializers

from apps.events.models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "description",
            "banner",
            "location",
            "event_type",
            "start_datetime",
            "end_datetime",
            "visibility",
            "status",
            "registration_enabled",
            "registration_mode",
            "registration_deadline",
            "payment_required",
            "registration_fee",
            "capacity",
            "enrolled_count",
            "youtube_live_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "enrolled_count", "created_at", "updated_at")


class EventAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "branch",
            "title",
            "description",
            "banner",
            "location",
            "event_type",
            "start_datetime",
            "end_datetime",
            "visibility",
            "status",
            "registration_enabled",
            "registration_mode",
            "registration_deadline",
            "payment_required",
            "registration_fee",
            "capacity",
            "enrolled_count",
            "youtube_live_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "enrolled_count", "created_at", "updated_at")
