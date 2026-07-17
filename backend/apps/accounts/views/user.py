"""User management API views."""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied

from apps.accounts.constants import Roles
from apps.accounts.models import Branch
from apps.accounts.permissions import IsSuperAdmin, IsSuperAdminOrBranchManager, user_manages_branch
from apps.accounts.services.branch_service import get_branch_or_404
from apps.accounts.serializers.user import (
    CreateBranchManagerSerializer,
    CreateStaffUserSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from apps.accounts.services.user_service import (
    get_user_list_queryset,
    change_email,
    update_user,
    create_staff_user,
    create_branch_manager,
    activate_user,
    deactivate_user,
    archive_user,
    get_user_or_404,
    _check_user_scope,
) 
from apps.accounts.permissions.roles import user_is_super_admin
from rest_framework.response import Response


class UserListPagination(PageNumberPagination):
    """Default pagination for user list endpoint."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100

class UserListView(generics.ListAPIView):
    """
    List users visible to the requester.

    Query params: ``search`` filters by email substring.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]
    pagination_class = UserListPagination

    def get_queryset(self):
        """Return a filtered queryset based on the requester role."""
        return get_user_list_queryset(self.request)

class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        user = get_user_or_404(self.kwargs["pk"])

        if self.request.method == "GET":
            if self.request.user == user or user_is_super_admin(self.request.user):
                return user

            _check_user_scope(self.request, user)
            return user

        if self.request.user != user:
            raise PermissionDenied("You can only update your own profile.")

        return user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserUpdateSerializer
        
        return UserSerializer

    def perform_update(self, serializer):
        user = self.get_object()
        data = serializer.validated_data.copy()

        new_email = data.pop("email", None)
        if new_email is not None and new_email != user.email:
            current_password = data.pop("current_password", None)
            change_email(
                user=user,
                new_email=new_email,
                password=current_password,
                actor=self.request.user,
            )

        if data:
            update_user(
                user=user,
                actor=self.request.user,
                **data,
            )

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

class CreateStaffUserView(generics.CreateAPIView):
    serializer_class = CreateStaffUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]

    @extend_schema(tags=["Users"], request=CreateStaffUserSerializer, responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        branch = get_branch_or_404(serializer.validated_data["branch_id"])

        if not (
            user_is_super_admin(request.user)
            or user_manages_branch(request.user, branch.id)
        ):
            raise PermissionDenied("Cannot create staff for this branch.")

        user = create_staff_user(
            email=serializer.validated_data["email"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            password=serializer.validated_data["password"],
            branch=branch,
            role=serializer.validated_data.get("role", Roles.INSTRUCTOR),
            assigned_by=request.user,
        )

        # Apply optional profile fields if provided
        profile_fields = {k: serializer.validated_data[k] for k in ("phone_number", "gender", "date_of_birth") if k in serializer.validated_data}
        if profile_fields:
            user = update_user(user, actor=request.user, **profile_fields)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class CreateBranchManagerView(generics.CreateAPIView):
    """Create a Branch Manager (Super Admin only)."""
    serializer_class = CreateBranchManagerSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(tags=["Users"], request=CreateBranchManagerSerializer, responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        branch = get_branch_or_404(serializer.validated_data["branch_id"])

        user = create_branch_manager(
            email=serializer.validated_data["email"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            password=serializer.validated_data["password"],
            branch=branch,
            assigned_by=request.user,
        )

        # Apply optional profile fields if provided
        profile_fields = {k: serializer.validated_data[k] for k in ("phone_number", "gender", "date_of_birth") if k in serializer.validated_data}
        if profile_fields:
            user = update_user(user, actor=request.user, **profile_fields)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class UserActivateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]

    @extend_schema(tags=["Users"], responses=UserSerializer)
    def post(self, request, pk):
        user = get_user_or_404(pk)
        _check_user_scope(request, user)

        activate_user(user, actor=request.user)

        return Response(UserSerializer(user).data)

class UserDeactivateView(APIView):
    """Suspend a user account."""

    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]

    @extend_schema(tags=["Users"], responses={200: UserSerializer})
    def post(self, request, pk):
        user = get_user_or_404(pk)
        _check_user_scope(request, user)

        deactivate_user(user, actor=request.user)

        return Response(UserSerializer(user).data)

class UserArchiveView(APIView):
    """Archive a user account."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(tags=["Users"], responses={200: UserSerializer})
    def post(self, request, pk):
        user = get_user_or_404(pk)

        archive_user(user, actor=request.user)

        return Response(UserSerializer(user).data)
