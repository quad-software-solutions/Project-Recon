from rest_framework import serializers

from apps.events.models import TournamentTeam


class TournamentTeamAdminSerializer(serializers.ModelSerializer):
    tournament_title = serializers.CharField(
        source="tournament.event.title", read_only=True
    )

    class Meta:
        model = TournamentTeam
        fields = (
            "id",
            "tournament",
            "tournament_title",
            "team_name",
            "organization",
            "coach_name",
            "contact_email",
            "contact_phone",
            "wins",
            "losses",
            "draws",
            "points",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id", "tournament_title", "wins", "losses", "draws", "points",
            "created_at", "updated_at",
        )
