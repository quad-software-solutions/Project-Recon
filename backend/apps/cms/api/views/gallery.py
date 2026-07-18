"""API views for the Gallery model.

Provides public read-only access and admin CRUD endpoints for managing
gallery items (photos and video links).
"""

from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import GallerySerializer, GalleryAdminSerializer
from apps.cms.services.gallery_service import (
    list_active_gallery_items,
    list_gallery_items,
    create_gallery_item,
    update_gallery_item,
    delete_gallery_item,
    get_gallery_or_404,
)


class PublicGalleryListView(generics.ListAPIView):
    """Public endpoint to list active gallery items."""

    permission_classes = [AllowAny]
    serializer_class = GallerySerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at"]

    @extend_schema(tags=["CMS - Gallery"])
    def get_queryset(self):
        return list_active_gallery_items()


class AdminGalleryListCreateView(generics.ListCreateAPIView):
    """Admin endpoint to list all gallery items or create a new one."""

    permission_classes = [IsCMSStaff]
    serializer_class = GalleryAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at"]

    @extend_schema(tags=["CMS - Admin - Gallery"])
    def get_queryset(self):
        return list_gallery_items()

    def create(self, request, *args, **kwargs):
        """Create a new gallery item."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = create_gallery_item(serializer.validated_data, actor=request.user)
        return Response(
            GalleryAdminSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class PublicGalleryDetailView(generics.RetrieveAPIView):
    """Public endpoint to retrieve a single active gallery item."""

    permission_classes = [AllowAny]
    serializer_class = GallerySerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Gallery"])
    def get_object(self):
        return get_gallery_or_404(self.kwargs["pk"], active_only=True)


class AdminGalleryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint to retrieve, update, or permanently delete a gallery item."""

    permission_classes = [IsCMSStaff]
    serializer_class = GalleryAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Gallery"])
    def get_object(self):
        return get_gallery_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        """Partially update a gallery item."""
        kwargs["partial"] = True
        item = self.get_object()
        serializer = self.get_serializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = update_gallery_item(item, serializer.validated_data, actor=request.user)
        return Response(GalleryAdminSerializer(item).data)

    def destroy(self, request, *args, **kwargs):
        """Permanently delete a gallery item."""
        item = self.get_object()
        delete_gallery_item(item, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
