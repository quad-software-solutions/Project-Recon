from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.api.serializers import (
    ProductAdminSerializer,
    ProductSerializer,
)
from apps.store.services.product_service import (
    activate_product,
    archive_product,
    create_product,
    deactivate_product,
    get_product_or_404,
    list_active_products,
    list_products,
    restore_product,
    update_product,
)


class PublicProductListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer

    @extend_schema(tags=["Store - Products"])
    def get_queryset(self):
        return list_active_products()


class PublicProductDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Products"])
    def get_object(self):
        return get_product_or_404(self.kwargs["pk"])


class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer

    @extend_schema(tags=["Store - Admin - Products"])
    def get_queryset(self):
        return list_products()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = create_product(serializer.validated_data, actor=request.user)
        return Response(
            ProductAdminSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Admin - Products"])
    def get_object(self):
        return get_product_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        product = self.get_object()
        serializer = self.get_serializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = update_product(
            product, serializer.validated_data, actor=request.user
        )
        return Response(ProductAdminSerializer(product).data)


@extend_schema(
    tags=["Store - Admin - Products"],
    summary="Archive a product",
)
class AdminProductArchiveView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["pk"])
        product = archive_product(product, actor=request.user)
        return Response(ProductAdminSerializer(product).data)


@extend_schema(
    tags=["Store - Admin - Products"],
    summary="Restore an archived product",
)
class AdminProductRestoreView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["pk"])
        product = restore_product(product, actor=request.user)
        return Response(ProductAdminSerializer(product).data)


@extend_schema(
    tags=["Store - Admin - Products"],
    summary="Activate a product",
)
class AdminProductActivateView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["pk"])
        product = activate_product(product, actor=request.user)
        return Response(ProductAdminSerializer(product).data)


@extend_schema(
    tags=["Store - Admin - Products"],
    summary="Deactivate a product",
)
class AdminProductDeactivateView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["pk"])
        product = deactivate_product(product, actor=request.user)
        return Response(ProductAdminSerializer(product).data)
