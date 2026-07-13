from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.api.serializers import (
    ImageReorderSerializer,
    ProductImageAdminSerializer,
)
from apps.store.services.product_image_service import (
    delete_image,
    get_image_or_404,
    list_product_images,
    reorder_images,
    set_primary_image,
    upload_image,
)
from apps.store.services.product_service import get_product_or_404


class AdminProductImageUploadView(generics.CreateAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductImageAdminSerializer
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["Store - Admin - Product Images"])
    def create(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["product_pk"])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = upload_image(
            product=product,
            image_file=serializer.validated_data["image"],
            alt_text=serializer.validated_data.get("alt_text"),
            is_primary=serializer.validated_data.get("is_primary", False),
            actor=request.user,
        )
        return Response(
            ProductImageAdminSerializer(image).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductImageListView(generics.ListAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductImageAdminSerializer

    @extend_schema(tags=["Store - Admin - Product Images"])
    def get_queryset(self):
        product = get_product_or_404(self.kwargs["product_pk"])
        return list_product_images(product)


class AdminProductImageRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductImageAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Admin - Product Images"])
    def get_object(self):
        return get_image_or_404(self.kwargs["pk"])

    def perform_destroy(self, instance):
        delete_image(instance, actor=self.request.user)


@extend_schema(
    tags=["Store - Admin - Product Images"],
    summary="Set image as primary",
)
class AdminProductImageSetPrimaryView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ProductImageAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        image = get_image_or_404(self.kwargs["pk"])
        image = set_primary_image(image, actor=request.user)
        return Response(ProductImageAdminSerializer(image).data)


@extend_schema(
    tags=["Store - Admin - Product Images"],
    summary="Reorder images for a product",
)
class AdminProductImageReorderView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = ImageReorderSerializer

    def post(self, request, *args, **kwargs):
        product = get_product_or_404(self.kwargs["product_pk"])
        serializer = ImageReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        images = reorder_images(
            product,
            serializer.validated_data["ordered_ids"],
            actor=request.user,
        )
        return Response(
            ProductImageAdminSerializer(images, many=True).data,
        )
