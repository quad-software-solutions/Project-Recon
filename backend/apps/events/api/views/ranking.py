from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import TeamStandingSerializer
from apps.events.services.ranking_service import (
    get_standings,
    get_tournament_winner,
)
from apps.events.services.tournament_service import get_tournament_or_404


class AdminTournamentStandingsView(APIView):
    permission_classes = [IsEventStaff]

    @extend_schema(
        tags=["Events - Admin - Rankings"],
        summary="Get tournament standings",
        description="Retrieve ranked teams for a tournament with optional top N limit.",
        parameters=[
            {
                "name": "top",
                "in": "query",
                "required": False,
                "schema": {"type": "integer", "minimum": 1},
                "description": "Limit to top N teams.",
            }
        ],
    )
    def get(self, request, pk):
        tournament = get_tournament_or_404(pk)
        top_n = request.query_params.get("top")
        if top_n is not None:
            try:
                top_n = int(top_n)
            except (ValueError, TypeError):
                top_n = None

        standings = list(get_standings(tournament.id, top_n=top_n))
        for i, team in enumerate(standings, 1):
            team._rank = i

        serializer = TeamStandingSerializer(standings, many=True)
        return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Rankings"], summary="Get tournament winner", description="Retrieve the top-ranked team (winner) of a tournament."),
)
class AdminTournamentWinnerView(APIView):
    permission_classes = [IsEventStaff]

    def get(self, request, pk):
        tournament = get_tournament_or_404(pk)
        winner = get_tournament_winner(tournament.id)
        if winner is None:
            return Response(None, status=status.HTTP_200_OK)

        winner._rank = 1
        serializer = TeamStandingSerializer(winner)
        return Response(serializer.data)
