from rest_framework import serializers

from apps.events.models import Tournament


class TournamentSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Tournament
        fields = (
            "id",
            "event",
            "event_title",
            "category",
            "category_name",
            "max_teams",
            "prize_pool",
            "is_closed",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_closed", "created_at", "updated_at")


class TournamentAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Tournament
        fields = (
            "id",
            "event",
            "event_title",
            "category",
            "category_name",
            "max_teams",
            "prize_pool",
            "is_closed",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "event_title", "category_name", "is_closed", "created_at", "updated_at")
