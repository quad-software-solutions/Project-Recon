from rest_framework import serializers

from apps.events.models import TournamentCategory


class TournamentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentCategory
        fields = (
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
