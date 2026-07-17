from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.api.serializers import (
    CategoryAdminSerializer,
    CategorySerializer,
)
from apps.store.services.category_service import (
    activate_category,
    create_category,
    deactivate_category,
    get_category_or_404,
    list_active_categories,
    list_categories,
    update_category,
)


class PublicCategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    @extend_schema(tags=["Store - Categories"])
    def get_queryset(self):
        return list_active_categories()


class PublicCategoryDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Categories"])
    def get_object(self):
        return get_category_or_404(self.kwargs["pk"])


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = CategoryAdminSerializer

    @extend_schema(tags=["Store - Admin - Categories"])
    def get_queryset(self):
        return list_categories()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(serializer.validated_data, actor=request.user)
        return Response(
            CategoryAdminSerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


class AdminCategoryRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = CategoryAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Admin - Categories"])
    def get_object(self):
        return get_category_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = update_category(
            category, serializer.validated_data, actor=request.user
        )
        return Response(CategoryAdminSerializer(category).data)


@extend_schema(
    tags=["Store - Admin - Categories"],
    summary="Activate a category",
)
class AdminCategoryActivateView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = CategoryAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        category = get_category_or_404(self.kwargs["pk"])
        category = activate_category(category, actor=request.user)
        return Response(CategoryAdminSerializer(category).data)


@extend_schema(
    tags=["Store - Admin - Categories"],
    summary="Deactivate a category",
)
class AdminCategoryDeactivateView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = CategoryAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        category = get_category_or_404(self.kwargs["pk"])
        category = deactivate_category(category, actor=request.user)
        return Response(CategoryAdminSerializer(category).data)
