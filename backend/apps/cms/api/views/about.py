from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import AboutUsSerializer, AboutUsAdminSerializer
from apps.cms.services.about_service import (
    list_active_about_us,
    list_about_us,
    create_about_us,
    update_about_us,
    delete_about_us,
    get_about_us_or_404,
    get_about_us_by_slug_or_404,
)


class PublicAboutUsListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = AboutUsSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "mission", "vision"]
    ordering_fields = ["title", "created_at"]

    @extend_schema(tags=["CMS - About Us"])
    def get_queryset(self):
        return list_active_about_us()


class PublicAboutUsDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = AboutUsSerializer
    lookup_url_kwarg = "slug"
    lookup_field = "slug"

    @extend_schema(tags=["CMS - About Us"])
    def get_object(self):
        return get_about_us_by_slug_or_404(self.kwargs["slug"])


class AdminAboutUsListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = AboutUsAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "mission", "vision"]
    ordering_fields = ["title", "created_at"]

    @extend_schema(tags=["CMS - Admin - About Us"])
    def get_queryset(self):
        return list_about_us()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        about = create_about_us(serializer.validated_data, actor=request.user)
        return Response(
            AboutUsAdminSerializer(about).data,
            status=status.HTTP_201_CREATED,
        )


class AdminAboutUsRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = AboutUsAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - About Us"])
    def get_object(self):
        return get_about_us_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        about = self.get_object()
        serializer = self.get_serializer(about, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        about = update_about_us(about, serializer.validated_data, actor=request.user)
        return Response(AboutUsAdminSerializer(about).data)

    def destroy(self, request, *args, **kwargs):
        about = self.get_object()
        delete_about_us(about, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
