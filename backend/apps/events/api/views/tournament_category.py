from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response

from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import TournamentCategorySerializer
from apps.events.services.tournament_category_service import (
    list_categories,
    create_category,
    update_category,
    delete_category,
    get_category_or_404,
)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="List categories", description="Retrieve all tournament categories."),
    post=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="Create a category", description="Create a new tournament category."),
)
class AdminTournamentCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentCategorySerializer

    def get_queryset(self):
        return list_categories()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(serializer.validated_data, actor=request.user)
        return Response(
            TournamentCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="Get category details", description="Retrieve a single tournament category by ID."),
    put=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="Update a category", description="Fully update a tournament category."),
    patch=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="Partially update a category", description="Partially update a tournament category."),
    delete=extend_schema(tags=["Events - Admin - Tournament Categories"], summary="Delete a category", description="Delete a tournament category."),
)
class AdminTournamentCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = TournamentCategorySerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        return get_category_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = update_category(category, serializer.validated_data, actor=request.user)
        return Response(TournamentCategorySerializer(category).data)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        delete_category(category, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
