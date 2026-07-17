from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.response import Response

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
)
from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import TournamentTeamAdminSerializer
from apps.events.services.tournament_service import get_tournament_or_404
from apps.events.services.tournament_team_service import (
    list_teams,
    create_team,
    update_team,
    delete_team,
    get_team_or_404,
)


@extend_schema_view(
    get=extend_schema(
        tags=["Events - Admin - Tournament Teams"],
        summary="List teams",
        description="Retrieve tournament teams, optionally filtered by tournament.",
        parameters=[OpenApiParameter(name="tournament", description="Filter by tournament ID", required=False, type=str)],
    ),
    post=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="Create a team", description="Create a new tournament team."),
)
class AdminTeamListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer

    def get_queryset(self):
        tournament_id = self.request.query_params.get("tournament")
        user = self.request.user
        branch_ids = None
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_ids = get_active_branch_ids(user)
        return list_teams(tournament_id=tournament_id, branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = create_team(serializer.validated_data, actor=request.user)
        return Response(
            TournamentTeamAdminSerializer(team).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="Get team details", description="Retrieve a single tournament team by ID."),
    put=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="Update a team", description="Fully update a tournament team."),
    patch=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="Partially update a team", description="Partially update a tournament team."),
    delete=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="Delete a team", description="Delete a tournament team."),
)
class AdminTeamRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        obj = get_team_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        team = self.get_object()
        serializer = self.get_serializer(team, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        team = update_team(team, serializer.validated_data, actor=request.user)
        return Response(TournamentTeamAdminSerializer(team).data)

    def destroy(self, request, *args, **kwargs):
        team = self.get_object()
        delete_team(team, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournament Teams"], summary="List teams for a tournament", description="Retrieve all teams belonging to a specific tournament."),
)
class AdminTournamentTeamListView(generics.ListAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer

    def get_queryset(self):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, tournament)
        return list_teams(tournament_id=tournament.id)
