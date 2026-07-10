from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response

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


class AdminTeamListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer

    @extend_schema(tags=["Events - Admin - Tournament Teams"])
    def get_queryset(self):
        tournament_id = self.request.query_params.get("tournament")
        return list_teams(tournament_id=tournament_id)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = create_team(serializer.validated_data, actor=request.user)
        return Response(
            TournamentTeamAdminSerializer(team).data,
            status=status.HTTP_201_CREATED,
        )


class AdminTeamRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Tournament Teams"])
    def get_object(self):
        return get_team_or_404(self.kwargs["pk"])

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


class AdminTournamentTeamListView(generics.ListAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentTeamAdminSerializer

    @extend_schema(tags=["Events - Admin - Tournament Teams"])
    def get_queryset(self):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        return list_teams(tournament_id=tournament.id)
