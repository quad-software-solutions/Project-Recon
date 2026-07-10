from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response

from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import TournamentAdminSerializer
from apps.events.services.tournament_service import (
    list_tournaments,
    create_tournament,
    update_tournament,
    delete_tournament,
    get_tournament_or_404,
    close_tournament,
    reopen_tournament,
)


class AdminTournamentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer

    @extend_schema(tags=["Events - Admin - Tournaments"])
    def get_queryset(self):
        return list_tournaments()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tournament = create_tournament(serializer.validated_data, actor=request.user)
        return Response(
            TournamentAdminSerializer(tournament).data,
            status=status.HTTP_201_CREATED,
        )


class AdminTournamentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Tournaments"])
    def get_object(self):
        return get_tournament_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        tournament = self.get_object()
        serializer = self.get_serializer(tournament, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tournament = update_tournament(tournament, serializer.validated_data, actor=request.user)
        return Response(TournamentAdminSerializer(tournament).data)

    def destroy(self, request, *args, **kwargs):
        tournament = self.get_object()
        delete_tournament(tournament, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminTournamentCloseView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Tournaments"])
    def post(self, request, *args, **kwargs):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        tournament = close_tournament(tournament, actor=request.user)
        return Response(TournamentAdminSerializer(tournament).data)


class AdminTournamentReopenView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Tournaments"])
    def post(self, request, *args, **kwargs):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        tournament = reopen_tournament(tournament, actor=request.user)
        return Response(TournamentAdminSerializer(tournament).data)
