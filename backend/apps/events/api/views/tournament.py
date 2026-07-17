from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
)
from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import (
    MatchAdminSerializer,
    TeamStandingSerializer,
    TournamentAdminSerializer,
    TournamentSerializer,
)
from apps.events.models import Tournament
from apps.events.services.tournament_service import (
    list_tournaments,
    create_tournament,
    update_tournament,
    delete_tournament,
    get_tournament_or_404,
    close_tournament,
    reopen_tournament,
)
from apps.events.services.match_service import list_matches
from apps.events.services.ranking_service import get_standings, get_tournament_winner


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List public tournaments", description="Retrieve all published, active tournaments."),
)
class PublicTournamentListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = TournamentSerializer

    def get_queryset(self):
        return Tournament.objects.filter(
            event__status="PUBLISHED",
            event__is_active=True,
        ).select_related("event", "category").order_by("-created_at")


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="Get tournament details", description="Retrieve a single tournament by ID."),
)
class PublicTournamentDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = TournamentSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        return get_tournament_or_404(self.kwargs["pk"])


class PublicTournamentStandingsView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Events - Public"],
        summary="Get tournament standings",
        description="Retrieve ranked teams for a tournament. Use ?top=N to limit results.",
        parameters=[
            OpenApiParameter(name="top", description="Limit to top N teams", required=False, type=int),
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
        standings = get_standings(tournament.id, top_n=top_n)
        serializer = TeamStandingSerializer(standings, many=True)
        return Response(serializer.data)


class PublicTournamentWinnerView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    @extend_schema(tags=["Events - Public"], summary="Get tournament winner", description="Retrieve the top-ranked team (winner) of a tournament, or null if no completed matches exist.")
    def get(self, request, pk):
        tournament = get_tournament_or_404(pk)
        winner = get_tournament_winner(tournament.id)
        if winner is None:
            return Response(None)
        return Response(TeamStandingSerializer(winner).data)


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List tournament matches", description="Retrieve all matches for a tournament."),
)
class PublicTournamentMatchListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = MatchAdminSerializer

    def get_queryset(self):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        return list_matches(tournament_id=tournament.id)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournaments"], summary="List tournaments", description="Retrieve all tournaments scoped to user's branches."),
    post=extend_schema(tags=["Events - Admin - Tournaments"], summary="Create a tournament", description="Create a new tournament linked to an event."),
)
class AdminTournamentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer

    def get_queryset(self):
        user = self.request.user
        branch_ids = None
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_ids = get_active_branch_ids(user)
        return list_tournaments(branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tournament = create_tournament(serializer.validated_data, actor=request.user)
        return Response(
            TournamentAdminSerializer(tournament).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournaments"], summary="Get tournament details", description="Retrieve a single tournament by ID."),
    put=extend_schema(tags=["Events - Admin - Tournaments"], summary="Update a tournament", description="Fully update a tournament."),
    patch=extend_schema(tags=["Events - Admin - Tournaments"], summary="Partially update a tournament", description="Partially update a tournament."),
    delete=extend_schema(tags=["Events - Admin - Tournaments"], summary="Delete a tournament", description="Delete a tournament."),
)
class AdminTournamentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        obj = get_tournament_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

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


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Tournaments"], summary="Close a tournament", description="Close a tournament to prevent further modifications."),
)
class AdminTournamentCloseView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, tournament)
        tournament = close_tournament(tournament, actor=request.user)
        return Response(TournamentAdminSerializer(tournament).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Tournaments"], summary="Reopen a tournament", description="Reopen a closed tournament."),
)
class AdminTournamentReopenView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        tournament = get_tournament_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, tournament)
        tournament = reopen_tournament(tournament, actor=request.user)
        return Response(TournamentAdminSerializer(tournament).data)
