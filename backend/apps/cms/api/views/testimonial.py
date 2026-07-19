from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import TestimonialSerializer, TestimonialAdminSerializer
from apps.cms.services.testimonial_service import (
    list_active_testimonials,
    list_testimonials,
    create_testimonial,
    update_testimonial,
    delete_testimonial,
    get_testimonial_or_404,
)


class PublicTestimonialListView(generics.ListAPIView):
    """Public endpoint: list active testimonials ordered by the order field."""

    permission_classes = [AllowAny]
    serializer_class = TestimonialSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "role", "quote"]
    ordering_fields = ["order", "name"]
    ordering = ["order"]

    @extend_schema(tags=["CMS - Testimonials"])
    def get_queryset(self):
        return list_active_testimonials()


class PublicTestimonialDetailView(generics.RetrieveAPIView):
    """Public endpoint: retrieve a single active testimonial by ID."""

    permission_classes = [AllowAny]
    serializer_class = TestimonialSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Testimonials"])
    def get_object(self):
        return get_testimonial_or_404(self.kwargs["pk"], active_only=True)


class AdminTestimonialListCreateView(generics.ListCreateAPIView):
    """Admin endpoint: list all testimonials or create a new one."""

    permission_classes = [IsCMSStaff]
    serializer_class = TestimonialAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "role", "quote"]
    ordering_fields = ["order", "name", "created_at"]

    @extend_schema(tags=["CMS - Admin - Testimonials"])
    def get_queryset(self):
        return list_testimonials()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        testimonial = create_testimonial(serializer.validated_data, actor=request.user)
        return Response(
            TestimonialAdminSerializer(testimonial).data,
            status=status.HTTP_201_CREATED,
        )


class AdminTestimonialRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint: retrieve, update, or delete a testimonial."""

    permission_classes = [IsCMSStaff]
    serializer_class = TestimonialAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Testimonials"])
    def get_object(self):
        return get_testimonial_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        testimonial = self.get_object()
        serializer = self.get_serializer(testimonial, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        testimonial = update_testimonial(testimonial, serializer.validated_data, actor=request.user)
        return Response(TestimonialAdminSerializer(testimonial).data)

    def destroy(self, request, *args, **kwargs):
        testimonial = self.get_object()
        delete_testimonial(testimonial, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
