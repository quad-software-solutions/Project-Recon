"""Branch management API views."""

from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from apps.accounts.models import User
from apps.accounts.permissions import IsSuperAdmin
from apps.accounts.api.throttles import AdminUserThrottle
from apps.accounts.serializers.branch import (
    BranchCreateSerializer,
    BranchSerializer,
    BranchUpdateSerializer,
    BranchWithManagerSerializer,
    ManagerActionSerializer,
)
from apps.accounts.services.branch_service import (
    assign_branch_manager,
    create_branch,
    create_branch_with_manager,
    update_branch,
    change_branch_manager,
    activate_branch,
    deactivate_branch,
    archive_branch,
    get_branch_or_404,
    scoped_branches_queryset,
)
from rest_framework.response import Response

class BranchListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BranchCreateSerializer
    throttle_classes = [AdminUserThrottle]

    @extend_schema(tags=["Branches"], responses=BranchSerializer(many=True))
    def get_queryset(self):
        active_only = self.request.query_params.get("active_only", "").lower() in (
            "1", "true", "yes"
        )
        return scoped_branches_queryset(self.request, active_only=active_only)
    @extend_schema(tags=["Branches"], request=BranchCreateSerializer, responses={201: BranchSerializer})

    @extend_schema(tags=["Branches"], request=BranchSerializer, responses={201: BranchSerializer})
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = BranchSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        branch = create_branch(
            serializer.validated_data,
            actor=request.user,
        )
        return Response(
            BranchSerializer(branch).data,
            status=status.HTTP_201_CREATED,
        )

class BranchWithManagerView(generics.CreateAPIView):
    """Create a branch and assign an existing user as manager."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    throttle_classes = [AdminUserThrottle]

    @extend_schema(tags=["Branches"], request=BranchWithManagerSerializer, responses={201: BranchSerializer})
    def create(self, request):
        serializer = BranchWithManagerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            manager = User.objects.get(id=serializer.validated_data["manager_user_id"])
        except User.DoesNotExist:
            raise NotFound("Manager user not found.")

        branch = create_branch_with_manager(
            serializer.get_branch_fields(),
            manager,
            assigned_by=request.user,
        )

        return Response(
            BranchSerializer(branch).data, status=status.HTTP_201_CREATED
        )

class BranchDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a branch."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BranchSerializer
    lookup_url_kwarg = "pk"
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        branch = get_branch_or_404(self.kwargs["pk"])

        return branch

    @extend_schema(tags=["Branches"], responses=BranchSerializer)
    def retrieve(self, request, *args, **kwargs):
        branch = self.get_object()
        return Response(BranchSerializer(branch).data)

    @extend_schema(
        tags=["Branches"],
        request=BranchUpdateSerializer,
        responses=BranchSerializer,
    )
    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True

        branch = self.get_object()
        serializer = BranchUpdateSerializer(
            branch,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        branch = update_branch(
            branch,
            actor=request.user,
            **serializer.validated_data,
        )

        return Response(BranchSerializer(branch).data)

class BranchAssignManagerView(generics.GenericAPIView):
    """Assign a manager when the branch has no active manager."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = ManagerActionSerializer
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        return get_branch_or_404(self.kwargs["pk"])

    @extend_schema(
        tags=["Branches"],
        request=ManagerActionSerializer,
        responses=BranchSerializer,
    )
    def post(self, request, *args, **kwargs):
        branch = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            manager = User.objects.get(
                id=serializer.validated_data["manager_user_id"]
            )
        except User.DoesNotExist:
            raise NotFound("Manager user not found.")

        try:
            assign_branch_manager(
                branch,
                manager,
                assigned_by=request.user,
            )
        except ValueError as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(str(e))

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)


class BranchChangeManagerView(generics.GenericAPIView):
    """Replace the active Branch Manager."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = ManagerActionSerializer
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        return get_branch_or_404(self.kwargs["pk"])

    @extend_schema(
        tags=["Branches"],
        request=ManagerActionSerializer,
        responses=BranchSerializer,
    )
    def post(self, request, *args, **kwargs):
        branch = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            manager = User.objects.get(
                id=serializer.validated_data["manager_user_id"]
            )
        except User.DoesNotExist:
            raise NotFound("Manager user not found.")

        try:
            change_branch_manager(
                branch=branch,
                new_user=manager,
                assigned_by=request.user,
            )
        except ValueError as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(str(e))

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)

class BranchActivateView(generics.GenericAPIView):
    """Activate a branch."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        return get_branch_or_404(self.kwargs["pk"])

    @extend_schema(
        tags=["Branches"],
        responses=BranchSerializer,
    )
    def post(self, request, *args, **kwargs):
        branch = self.get_object()

        branch = activate_branch(
            branch,
            actor=request.user,
        )

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)


class BranchDeactivateView(generics.GenericAPIView):
    """Deactivate a branch."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        return get_branch_or_404(self.kwargs["pk"])

    @extend_schema(
        tags=["Branches"],
        responses=BranchSerializer,
    )
    def post(self, request, *args, **kwargs):
        branch = self.get_object()

        branch = deactivate_branch(
            branch,
            actor=request.user,
        )

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)


class BranchArchiveView(generics.GenericAPIView):
    """Archive a branch."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        return get_branch_or_404(self.kwargs["pk"])

    @extend_schema(
        tags=["Branches"],
        responses=BranchSerializer,
    )
    def post(self, request, *args, **kwargs):
        branch = self.get_object()

        branch = archive_branch(
            branch,
            actor=request.user,
        )

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)
