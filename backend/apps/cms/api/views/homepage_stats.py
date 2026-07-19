from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import (
    HomepageStatisticSerializer,
    HomepageStatisticAdminSerializer,
)
from apps.cms.services.homepage_statistic_service import (
    get_stats,
    get_stats_or_404,
    list_stats,
    create_stats,
    update_stats,
    update_stats_by_instance,
    delete_stats,
)


class PublicHomepageStatsListView(generics.ListAPIView):
    """Public endpoint: list homepage statistics."""

    permission_classes = [AllowAny]
    serializer_class = HomepageStatisticSerializer
    pagination_class = PublicPagination

    @extend_schema(tags=["CMS - Homepage Stats"])
    def get_queryset(self):
        return list_stats()


class PublicHomepageStatsDetailView(generics.RetrieveAPIView):
    """Public endpoint: retrieve homepage statistics by ID."""

    permission_classes = [AllowAny]
    serializer_class = HomepageStatisticSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Homepage Stats"])
    def get_object(self):
        return get_stats_or_404(self.kwargs["pk"])


class PublicHomepageStatsCurrentView(generics.RetrieveAPIView):
    """Public endpoint: retrieve the current (default) homepage statistics."""

    permission_classes = [AllowAny]
    serializer_class = HomepageStatisticSerializer

    @extend_schema(tags=["CMS - Homepage Stats"])
    def get_object(self):
        return get_stats()


class AdminHomepageStatsListCreateView(generics.ListCreateAPIView):
    """Admin endpoint: list all homepage statistics or create a new one."""

    permission_classes = [IsCMSStaff]
    serializer_class = HomepageStatisticAdminSerializer
    pagination_class = AdminPagination

    @extend_schema(tags=["CMS - Admin - Homepage Stats"])
    def get_queryset(self):
        return list_stats()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stats = create_stats(serializer.validated_data, actor=request.user)
        return Response(
            HomepageStatisticAdminSerializer(stats).data,
            status=status.HTTP_201_CREATED,
        )


class AdminHomepageStatsRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint: retrieve, update, or delete a homepage statistic record."""

    permission_classes = [IsCMSStaff]
    serializer_class = HomepageStatisticAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Homepage Stats"])
    def get_object(self):
        return get_stats_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        stats = self.get_object()
        serializer = self.get_serializer(stats, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        stats = update_stats_by_instance(stats, serializer.validated_data, actor=request.user)
        return Response(HomepageStatisticAdminSerializer(stats).data)

    def destroy(self, request, *args, **kwargs):
        stats = self.get_object()
        delete_stats(stats, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
