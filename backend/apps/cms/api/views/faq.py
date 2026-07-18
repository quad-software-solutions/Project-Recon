from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import FAQSerializer, FAQAdminSerializer
from apps.cms.services.faq_service import (
    list_active_faqs,
    list_faqs,
    create_faq,
    update_faq,
    delete_faq,
    get_faq_or_404,
)


class PublicFAQListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = FAQSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["question", "answer"]
    ordering_fields = ["created_at"]

    @extend_schema(tags=["CMS - FAQ"])
    def get_queryset(self):
        return list_active_faqs()


class AdminFAQListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = FAQAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["question", "answer"]
    ordering_fields = ["created_at"]

    @extend_schema(tags=["CMS - Admin - FAQ"])
    def get_queryset(self):
        return list_faqs()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faq = create_faq(serializer.validated_data, actor=request.user)
        return Response(
            FAQAdminSerializer(faq).data,
            status=status.HTTP_201_CREATED,
        )


class AdminFAQRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = FAQAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - FAQ"])
    def get_object(self):
        return get_faq_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        faq = self.get_object()
        serializer = self.get_serializer(faq, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        faq = update_faq(faq, serializer.validated_data, actor=request.user)
        return Response(FAQAdminSerializer(faq).data)

    def destroy(self, request, *args, **kwargs):
        faq = self.get_object()
        delete_faq(faq, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
