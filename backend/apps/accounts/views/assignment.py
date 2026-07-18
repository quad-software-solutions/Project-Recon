"""UserAssignment API views."""

from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.accounts.constants import Roles
from apps.accounts.models import Branch, User
from apps.accounts.permissions import IsSuperAdminOrBranchManager, user_manages_branch, user_is_super_admin
from apps.accounts.api.throttles import AdminUserThrottle
from apps.accounts.serializers.assignment import (
    AssignRoleSerializer,
    TransferUserSerializer,
    UpdateAssignmentSerializer,
    UserAssignmentSerializer,
)
from apps.accounts.services.assignment_service import (
    assign_role,
    change_primary_assignment,
    remove_assignment,
    transfer_user,
    update_assignment,
)
from apps.accounts.services.user_service import (
    get_assignment_or_404,
    scoped_assignments_queryset,
)

from rest_framework.response import Response

class AssignmentListCreateView(generics.ListCreateAPIView):
    """
    List or create role assignments.

    Query params: `user`, `branch` UUID filters.
    """

    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]
    serializer_class = UserAssignmentSerializer
    throttle_classes = [AdminUserThrottle]

 
    def get_queryset(self):
        user_id = self.request.query_params.get("user")
        branch_id = self.request.query_params.get("branch")

        return scoped_assignments_queryset(
            self.request,
            user_id=user_id,
            branch_id=branch_id,
        )

    @extend_schema(tags=["Assignments"], responses=UserAssignmentSerializer(many=True))
    def create(self, request, *args, **kwargs):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=serializer.validated_data["user_id"])
        except User.DoesNotExist:
            raise NotFound("User not found.")

        branch = None
        branch_id = serializer.validated_data.get("branch_id")

        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                raise NotFound("Branch not found.")

            if not user_is_super_admin(request.user) and not user_manages_branch(
                request.user, branch.id
            ):
                raise PermissionDenied("Cannot assign roles for this branch.")

        elif serializer.validated_data["role"] != Roles.SUPER_ADMIN:
            return Response(
                {
                    "detail": "branch_id is required for this role.",
                    "code": "validation_error",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        elif not user_is_super_admin(request.user):
            raise PermissionDenied("Only Super Admin can assign Super Admin role.")

        if not user_is_super_admin(request.user) and serializer.validated_data["role"] == Roles.BRANCH_MANAGER:
            raise PermissionDenied("Only Super Admin can assign Branch Manager role.")

        assignment = assign_role(
            user,
            serializer.validated_data["role"],
            branch,
            assigned_by=request.user,
            is_primary=serializer.validated_data.get("is_primary", False),
        )

        assignment = get_assignment_or_404(assignment.id)

        return Response(
            UserAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )

class AssignmentDetailView(APIView):
    """Update or remove an assignment."""

    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]
    throttle_classes = [AdminUserThrottle]

    @extend_schema(tags=["Assignments"], request=UpdateAssignmentSerializer, responses={200: UserAssignmentSerializer})
    def patch(self, request, pk):
        assignment = get_assignment_or_404(pk)

        if not assignment.branch_id and not user_is_super_admin(request.user):
            raise PermissionDenied("Cannot update this assignment.")
        
        if assignment.branch_id and not user_manages_branch(request.user, assignment.branch_id):
            if not user_is_super_admin(request.user):
                raise PermissionDenied("Cannot update this assignment.")
        
        serializer = UpdateAssignmentSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        assignment = update_assignment(
            assignment, actor=request.user, **serializer.validated_data
        )
        assignment = get_assignment_or_404(assignment.id)

        return Response(UserAssignmentSerializer(assignment).data)

    @extend_schema(tags=["Assignments"], responses={204: None})
    def delete(self, request, pk):
        assignment = get_assignment_or_404(pk)

        if not assignment.branch_id and not user_is_super_admin(request.user):
            raise PermissionDenied("Cannot remove this assignment.")

        if assignment.branch_id and not user_manages_branch(request.user, assignment.branch_id):
            if not user_is_super_admin(request.user):
                raise PermissionDenied("Cannot remove this assignment.")
        
        remove_assignment(assignment, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssignmentMakePrimaryView(APIView):
    """Set an assignment as the user's primary context."""

    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]
    throttle_classes = [AdminUserThrottle]

    @extend_schema(tags=["Assignments"], responses={200: UserAssignmentSerializer})
    def post(self, request, pk):
        assignment = get_assignment_or_404(pk)

        if not assignment.branch_id and not user_is_super_admin(request.user):
            raise PermissionDenied("Cannot modify this assignment.")

        if assignment.branch_id and not user_manages_branch(request.user, assignment.branch_id):
            if not user_is_super_admin(request.user):
                raise PermissionDenied("Cannot modify this assignment.")
        
        change_primary_assignment(assignment.user, assignment, actor=request.user)
        assignment.refresh_from_db()

        return Response(UserAssignmentSerializer(assignment).data)


class AssignmentTransferView(APIView):
    """Transfer a user's role from one branch to another."""

    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchManager]
    throttle_classes = [AdminUserThrottle]

    @extend_schema(tags=["Assignments"], request=TransferUserSerializer, responses={200: UserAssignmentSerializer})
    def post(self, request):
        serializer = TransferUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not user_is_super_admin(request.user):
            
            for bid in (serializer.validated_data["from_branch_id"], serializer.validated_data["to_branch_id"]):
                
                if not user_manages_branch(request.user, bid):
                    raise PermissionDenied("Cannot transfer across this branch.")
        
        try:
            user = User.objects.get(id=serializer.validated_data["user_id"])
        except User.DoesNotExist:
            raise NotFound("User not found.")
        try:
            from_branch = Branch.objects.get(id=serializer.validated_data["from_branch_id"])
        except Branch.DoesNotExist:
            raise NotFound("Source branch not found.")
        try:
            to_branch = Branch.objects.get(id=serializer.validated_data["to_branch_id"])
        except Branch.DoesNotExist:
            raise NotFound("Destination branch not found.")
        
        assignment = transfer_user(
            user,
            from_branch,
            to_branch,
            serializer.validated_data["role"],
            actor=request.user,
        )
        assignment = get_assignment_or_404(assignment.id)
        
        return Response(UserAssignmentSerializer(assignment).data)
