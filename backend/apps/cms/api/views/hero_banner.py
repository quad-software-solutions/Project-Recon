from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import HeroBannerSerializer, HeroBannerAdminSerializer
from apps.cms.services.hero_banner_service import (
    list_active_hero_banners,
    list_hero_banners,
    create_hero_banner,
    update_hero_banner,
    delete_hero_banner,
    get_hero_banner_or_404,
)


class PublicHeroBannerListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = HeroBannerSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "subtitle"]
    ordering_fields = ["title", "created_at", "updated_at"]

    @extend_schema(tags=["CMS - Hero Banners"])
    def get_queryset(self):
        return list_active_hero_banners()


class AdminHeroBannerListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = HeroBannerAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "subtitle"]
    ordering_fields = ["title", "created_at", "updated_at"]

    @extend_schema(tags=["CMS - Admin - Hero Banners"])
    def get_queryset(self):
        return list_hero_banners()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        banner = create_hero_banner(serializer.validated_data, actor=request.user)
        return Response(
            HeroBannerAdminSerializer(banner).data,
            status=status.HTTP_201_CREATED,
        )


class AdminHeroBannerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = HeroBannerAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Hero Banners"])
    def get_object(self):
        return get_hero_banner_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        banner = self.get_object()
        serializer = self.get_serializer(banner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        banner = update_hero_banner(banner, serializer.validated_data, actor=request.user)
        return Response(HeroBannerAdminSerializer(banner).data)

    def destroy(self, request, *args, **kwargs):
        banner = self.get_object()
        delete_hero_banner(banner, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
