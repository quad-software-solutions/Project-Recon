"""API views for the MapNode model.

Provides public read-only access and admin CRUD endpoints for managing
journey map nodes.
"""

from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import MapNodeSerializer, MapNodeAdminSerializer
from apps.cms.services.map_node_service import (
    list_active_map_nodes,
    list_map_nodes,
    create_map_node,
    update_map_node,
    delete_map_node,
    get_map_node_or_404,
)


class PublicMapNodeListView(generics.ListAPIView):
    """Public endpoint to list active map nodes for the journey map."""

    permission_classes = [AllowAny]
    serializer_class = MapNodeSerializer

    @extend_schema(tags=["CMS - Map Nodes"])
    def get_queryset(self):
        return list_active_map_nodes()


class AdminMapNodeListCreateView(generics.ListCreateAPIView):
    """Admin endpoint to list all map nodes or create a new one."""

    permission_classes = [IsCMSStaff]
    serializer_class = MapNodeAdminSerializer

    @extend_schema(tags=["CMS - Admin - Map Nodes"])
    def get_queryset(self):
        return list_map_nodes()

    def create(self, request, *args, **kwargs):
        """Create a new map node."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        node = create_map_node(serializer.validated_data, actor=request.user)
        return Response(
            MapNodeAdminSerializer(node).data,
            status=status.HTTP_201_CREATED,
        )


class AdminMapNodeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint to retrieve, update, or soft-delete a map node."""

    permission_classes = [IsCMSStaff]
    serializer_class = MapNodeAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Map Nodes"])
    def get_object(self):
        return get_map_node_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        """Partially update a map node."""
        kwargs["partial"] = True
        node = self.get_object()
        serializer = self.get_serializer(node, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        node = update_map_node(node, serializer.validated_data, actor=request.user)
        return Response(MapNodeAdminSerializer(node).data)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete a map node by setting is_active to False."""
        node = self.get_object()
        delete_map_node(node, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
