from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
)
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


@extend_schema_view(
    get=extend_schema(
        tags=["Events - Admin - Matches"],
        summary="List matches",
        description="Retrieve matches, optionally filtered by tournament.",
        parameters=[OpenApiParameter(name="tournament", description="Filter by tournament ID", required=False, type=str)],
    ),
    post=extend_schema(tags=["Events - Admin - Matches"], summary="Create a match", description="Create a new match for a tournament."),
)
class AdminMatchListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer

    def get_queryset(self):
        tournament_id = self.request.query_params.get("tournament")
        user = self.request.user
        branch_ids = None
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_ids = get_active_branch_ids(user)
        return list_matches(tournament_id=tournament_id, branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        match = create_match(serializer.validated_data, actor=request.user)
        return Response(
            MatchAdminSerializer(match).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Matches"], summary="Get match details", description="Retrieve a single match by ID."),
    put=extend_schema(tags=["Events - Admin - Matches"], summary="Update a match", description="Fully update a match."),
    patch=extend_schema(tags=["Events - Admin - Matches"], summary="Partially update a match", description="Partially update a match."),
    delete=extend_schema(tags=["Events - Admin - Matches"], summary="Delete a match", description="Delete a match."),
)
class AdminMatchRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        obj = get_match_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

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
        summary="Assign team to match side",
        description="Assign a tournament team to a side (SIDE_A or SIDE_B) in a match.",
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
        self.check_object_permissions(request, match)
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
        summary="Remove team from match side",
        description="Remove a tournament team from a match side.",
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
        self.check_object_permissions(request, match)
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
        summary="Record match scores",
        description="Set scores for both sides of a match.",
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
        self.check_object_permissions(request, match)
        side_a_score = request.data.get("side_a_score")
        side_b_score = request.data.get("side_b_score")

        if side_a_score is None or side_b_score is None:
            return Response(
                {"error": "Both 'side_a_score' and 'side_b_score' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match = record_scores(match, side_a_score, side_b_score, actor=request.user)
        return Response(MatchAdminSerializer(match).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Matches"], summary="Complete a match", description="Finalize a match, calculate the winner, and trigger ranking updates."),
)
class AdminMatchCompleteView(APIView):
    permission_classes = [IsEventStaff]

    def post(self, request, pk):
        match = get_match_or_404(pk)
        self.check_object_permissions(request, match)
        match = complete_match(match, actor=request.user)
        return Response(MatchAdminSerializer(match).data)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Matches"], summary="List matches for a tournament", description="Retrieve all matches belonging to a specific tournament."),
)
class AdminTournamentMatchListView(generics.ListAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = MatchAdminSerializer

    def get_queryset(self):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, tournament)
        return list_matches(tournament_id=tournament.id)
