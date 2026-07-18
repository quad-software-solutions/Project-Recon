from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import PartnerSerializer, PartnerAdminSerializer
from apps.cms.services.partner_service import (
    list_active_partners,
    list_partners,
    create_partner,
    update_partner,
    delete_partner,
    get_partner_or_404,
)


class PublicPartnerListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PartnerSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "type"]

    @extend_schema(tags=["CMS - Partners"])
    def get_queryset(self):
        return list_active_partners()


class AdminPartnerListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = PartnerAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "type"]

    @extend_schema(tags=["CMS - Admin - Partners"])
    def get_queryset(self):
        return list_partners()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        partner = create_partner(serializer.validated_data, actor=request.user)
        return Response(
            PartnerAdminSerializer(partner).data,
            status=status.HTTP_201_CREATED,
        )


class AdminPartnerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = PartnerAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Partners"])
    def get_object(self):
        return get_partner_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        partner = self.get_object()
        serializer = self.get_serializer(partner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        partner = update_partner(partner, serializer.validated_data, actor=request.user)
        return Response(PartnerAdminSerializer(partner).data)

    def destroy(self, request, *args, **kwargs):
        partner = self.get_object()
        delete_partner(partner, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
