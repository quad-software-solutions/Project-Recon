from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import MatchAdminSerializer
from apps.events.services.match_service import (
    assign_team_to_side,
    complete_match,
    create_match,
    delete_match,
    get_match_or_404,
    list_matches,
    record_scores,
    remove_team_from_side,
    update_match,
)
from apps.events.services.tournament_service import get_tournament_or_404


class AdminMatchListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer

    @extend_schema(tags=["Events - Admin - Matches"])
    def get_queryset(self):
        tournament_id = self.request.query_params.get("tournament")
        return list_matches(tournament_id=tournament_id)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        match = create_match(serializer.validated_data, actor=request.user)
        return Response(
            MatchAdminSerializer(match).data,
            status=status.HTTP_201_CREATED,
        )


class AdminMatchRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Matches"])
    def get_object(self):
        return get_match_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        match = self.get_object()
        serializer = self.get_serializer(match, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        match = update_match(match, serializer.validated_data, actor=request.user)
        return Response(MatchAdminSerializer(match).data)

    def destroy(self, request, *args, **kwargs):
        match = self.get_object()
        delete_match(match, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminMatchAssignTeamView(APIView):
    permission_classes = [IsEventStaff]

    @extend_schema(
        tags=["Events - Admin - Matches"],
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "side": {"type": "string", "enum": ["SIDE_A", "SIDE_B"]},
                    "tournament_team": {"type": "string", "format": "uuid"},
                },
                "required": ["side", "tournament_team"],
            }
        },
    )
    def post(self, request, pk):
        match = get_match_or_404(pk)
        side = request.data.get("side")
        team_id = request.data.get("tournament_team")

        if not side or not team_id:
            return Response(
                {"error": "Both 'side' and 'tournament_team' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        participant = assign_team_to_side(match, side, team_id, actor=request.user)
        return Response(
            {"id": str(participant.id), "side": side, "tournament_team": str(team_id)},
            status=status.HTTP_201_CREATED,
        )


class AdminMatchRemoveTeamView(APIView):
    permission_classes = [IsEventStaff]

    @extend_schema(
        tags=["Events - Admin - Matches"],
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "side": {"type": "string", "enum": ["SIDE_A", "SIDE_B"]},
                    "tournament_team": {"type": "string", "format": "uuid"},
                },
                "required": ["side", "tournament_team"],
            }
        },
    )
    def post(self, request, pk):
        match = get_match_or_404(pk)
        side = request.data.get("side")
        team_id = request.data.get("tournament_team")

        if not side or not team_id:
            return Response(
                {"error": "Both 'side' and 'tournament_team' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remove_team_from_side(match, side, team_id, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminMatchRecordScoresView(APIView):
    permission_classes = [IsEventStaff]

    @extend_schema(
        tags=["Events - Admin - Matches"],
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "side_a_score": {"type": "integer", "minimum": 0},
                    "side_b_score": {"type": "integer", "minimum": 0},
                },
                "required": ["side_a_score", "side_b_score"],
            }
        },
    )
    def post(self, request, pk):
        match = get_match_or_404(pk)
        side_a_score = request.data.get("side_a_score")
        side_b_score = request.data.get("side_b_score")

        if side_a_score is None or side_b_score is None:
            return Response(
                {"error": "Both 'side_a_score' and 'side_b_score' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match = record_scores(match, side_a_score, side_b_score, actor=request.user)
        return Response(MatchAdminSerializer(match).data)


class AdminMatchCompleteView(APIView):
    permission_classes = [IsEventStaff]

    @extend_schema(tags=["Events - Admin - Matches"])
    def post(self, request, pk):
        match = get_match_or_404(pk)
        match = complete_match(match, actor=request.user)
        return Response(MatchAdminSerializer(match).data)


class AdminTournamentMatchListView(generics.ListAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer

    @extend_schema(tags=["Events - Admin - Matches"])
    def get_queryset(self):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        return list_matches(tournament_id=tournament.id)
