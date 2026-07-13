from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.models import Branch
from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_super_admin,
)
from apps.store.api.permissions import IsStoreInventoryStaff
from apps.store.api.serializers import (
    BranchInventoryAdminSerializer,
    BranchInventorySerializer,
    InventoryAdjustSerializer,
    InventoryCorrectSerializer,
    InventoryTransferSerializer,
)
from apps.store.models import BranchInventory
from apps.store.models import Product
from apps.store.services.branch_inventory_service import (
    add_inventory,
    correct_inventory,
    get_branch_inventory,
    get_inventory_by_id_or_404,
    get_product_availability,
    reduce_inventory,
    transfer_inventory,
)
from apps.store.services.product_service import get_product_or_404


class PublicBranchInventoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BranchInventorySerializer

    @extend_schema(
        tags=["Store - Inventory"],
        parameters=[
            {
                "name": "branch",
                "required": True,
                "in": "query",
                "schema": {"type": "string", "format": "uuid"},
            }
        ],
    )
    def get_queryset(self):
        branch_id = self.request.query_params.get("branch")
        if not branch_id:
            raise ValidationError("branch query parameter is required.")
        try:
            branch = Branch.objects.get(pk=branch_id)
        except Branch.DoesNotExist:
            raise ValidationError("Branch not found.")
        return get_branch_inventory(branch)


class PublicProductAvailabilityView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BranchInventorySerializer

    @extend_schema(tags=["Store - Inventory"])
    def get_queryset(self):
        product = get_product_or_404(self.kwargs["product_pk"])
        return get_product_availability(product)


class AdminInventoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = BranchInventoryAdminSerializer

    @extend_schema(tags=["Store - Admin - Inventory"])
    def get_queryset(self):
        user = self.request.user
        qs = BranchInventory.objects.select_related("branch", "product__category")
        if user_is_branch_manager(user):
            branch_ids = get_active_branch_ids(user)
            qs = qs.filter(branch_id__in=branch_ids)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        branch = serializer.validated_data["branch"]
        if user_is_branch_manager(request.user):
            if branch.id not in get_active_branch_ids(request.user):
                raise ValidationError(
                    "You can only create inventory for your assigned branches."
                )
        from apps.store.services.branch_inventory_service import (
            correct_inventory,
        )

        inv = correct_inventory(
            branch,
            serializer.validated_data["product"],
            serializer.validated_data.get("quantity", 0),
            actor=request.user,
        )
        return Response(
            BranchInventoryAdminSerializer(inv).data,
            status=status.HTTP_201_CREATED,
        )


class AdminInventoryRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = BranchInventoryAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Store - Admin - Inventory"])
    def get_object(self):
        inv = get_inventory_by_id_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, inv)
        return inv

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        inv = self.get_object()
        serializer = self.get_serializer(inv, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "quantity" in data:
            from apps.store.services.branch_inventory_service import (
                correct_inventory,
            )

            inv = correct_inventory(
                inv.branch, inv.product, data.pop("quantity"), actor=request.user
            )
        for key, value in data.items():
            setattr(inv, key, value)
        inv.save(update_fields=list(data.keys()))
        return Response(BranchInventoryAdminSerializer(inv).data)


@extend_schema(
    tags=["Store - Admin - Inventory"],
    summary="Add stock to inventory",
)
class AdminInventoryAddView(generics.GenericAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = InventoryAdjustSerializer

    def post(self, request, *args, **kwargs):
        inv = get_inventory_by_id_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, inv)
        serializer = InventoryAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inv = add_inventory(
            inv.branch,
            inv.product,
            serializer.validated_data["quantity"],
            actor=request.user,
        )
        return Response(BranchInventoryAdminSerializer(inv).data)


@extend_schema(
    tags=["Store - Admin - Inventory"],
    summary="Reduce stock from inventory",
)
class AdminInventoryReduceView(generics.GenericAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = InventoryAdjustSerializer

    def post(self, request, *args, **kwargs):
        inv = get_inventory_by_id_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, inv)
        serializer = InventoryAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inv = reduce_inventory(
            inv.branch,
            inv.product,
            serializer.validated_data["quantity"],
            actor=request.user,
        )
        return Response(BranchInventoryAdminSerializer(inv).data)


@extend_schema(
    tags=["Store - Admin - Inventory"],
    summary="Correct inventory to exact quantity",
)
class AdminInventoryCorrectView(generics.GenericAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = InventoryCorrectSerializer

    def post(self, request, *args, **kwargs):
        inv = get_inventory_by_id_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, inv)
        serializer = InventoryCorrectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inv = correct_inventory(
            inv.branch,
            inv.product,
            serializer.validated_data["quantity"],
            actor=request.user,
        )
        return Response(BranchInventoryAdminSerializer(inv).data)


@extend_schema(
    tags=["Store - Admin - Inventory"],
    summary="Transfer stock between branches",
)
class AdminInventoryTransferView(generics.GenericAPIView):
    permission_classes = [IsStoreInventoryStaff]
    serializer_class = InventoryTransferSerializer

    def post(self, request, *args, **kwargs):
        serializer = InventoryTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            from_branch = Branch.objects.get(pk=data["from_branch"])
            to_branch = Branch.objects.get(pk=data["to_branch"])
        except Branch.DoesNotExist:
            raise ValidationError("Branch not found.")

        try:
            product = Product.objects.get(pk=data["product"])
        except Product.DoesNotExist:
            raise ValidationError("Product not found.")

        if user_is_branch_manager(request.user):
            allowed = get_active_branch_ids(request.user)
            if from_branch.id not in allowed or to_branch.id not in allowed:
                raise ValidationError(
                    "You can only transfer between your assigned branches."
                )

        result = transfer_inventory(
            from_branch,
            to_branch,
            product,
            data["quantity"],
            actor=request.user,
        )
        return Response(
            {
                "source": BranchInventoryAdminSerializer(result["source"]).data,
                "destination": BranchInventoryAdminSerializer(
                    result["destination"]
                ).data,
            }
        )
