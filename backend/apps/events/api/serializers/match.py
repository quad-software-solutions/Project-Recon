from rest_framework import serializers

from apps.events.models import Match, MatchParticipant, MatchSide


class MatchParticipantSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source="tournament_team.team_name", read_only=True)

    class Meta:
        model = MatchParticipant
        fields = ["id", "tournament_team", "team_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class MatchSideSerializer(serializers.ModelSerializer):
    participants = MatchParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = MatchSide
        fields = ["id", "side", "score", "participants"]
        read_only_fields = ["id"]


class MatchAdminSerializer(serializers.ModelSerializer):
    tournament_title = serializers.CharField(source="tournament.event.title", read_only=True)
    sides = MatchSideSerializer(many=True, read_only=True)
    winning_side_label = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "tournament",
            "tournament_title",
            "round",
            "scheduled_at",
            "started_at",
            "completed_at",
            "status",
            "winning_side",
            "winning_side_label",
            "sides",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "winning_side",
            "completed_at",
            "status",
            "created_at",
            "updated_at",
            "sides",
        ]

    def get_winning_side_label(self, obj):
        if obj.winning_side:
            return obj.winning_side.side
        return None
