from rest_framework import serializers

from apps.events.models import TournamentTeam


class TeamStandingSerializer(serializers.ModelSerializer):
    rank = serializers.SerializerMethodField()
    team_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = TournamentTeam
        fields = [
            "rank",
            "team_id",
            "team_name",
            "wins",
            "losses",
            "draws",
            "points",
        ]
        read_only_fields = fields

    def get_rank(self, obj):
        return getattr(obj, "_rank", None)
