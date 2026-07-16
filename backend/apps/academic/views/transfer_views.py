from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.academic.models import BranchTransferRequest, Enrollment
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    BranchTransferRequestCreateSerializer,
    BranchTransferRequestSerializer,
    BranchTransferApproveSerializer,
    BranchTransferRejectSerializer,
    EnrollmentSerializer,
    SwitchSubProgramSerializer,
)
from apps.academic.services.class_service import get_active_class_or_404
from apps.academic.services.enrollment_service import (
    get_enrollment_or_404,
    switch_subprogram,
)
from apps.academic.services.transfer_service import (
    approve_transfer,
    get_transfer_request_or_404,
    list_transfer_requests,
    reject_transfer,
    request_transfer,
)
from apps.accounts.services.branch_service import get_branch_or_404


@extend_schema_view(
    post=extend_schema(
        summary="Request Branch Transfer",
        tags=["Academic - Transfers"],
        request=BranchTransferRequestCreateSerializer,
    ),
)
class BranchTransferRequestView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = BranchTransferRequestCreateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            enrollment = get_enrollment_or_404(serializer.validated_data["enrollment"])
            target_class = get_active_class_or_404(serializer.validated_data["target_class"])
            to_branch = get_branch_or_404(serializer.validated_data["to_branch"])

            transfer_request = request_transfer(
                request.user,
                enrollment=enrollment,
                target_class=target_class,
                to_branch=to_branch,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            BranchTransferRequestSerializer(transfer_request).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(
        summary="List Transfer Requests",
        tags=["Academic - Transfers"],
    ),
)
class BranchTransferListView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = BranchTransferRequestSerializer

    def get(self, request):
        transfers = list_transfer_requests()
        return Response(
            BranchTransferRequestSerializer(transfers, many=True).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        summary="Approve Transfer Request",
        tags=["Academic - Transfers"],
        request=BranchTransferApproveSerializer,
    ),
)
class BranchTransferApproveView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = BranchTransferApproveSerializer

    def post(self, request, pk):
        try:
            transfer_request = get_transfer_request_or_404(pk)
            new_enrollment, updated_request = approve_transfer(
                request.user,
                transfer_request=transfer_request,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            {
                "new_enrollment": EnrollmentSerializer(new_enrollment).data,
                "transfer_request": BranchTransferRequestSerializer(updated_request).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        summary="Reject Transfer Request",
        tags=["Academic - Transfers"],
        request=BranchTransferRejectSerializer,
    ),
)
class BranchTransferRejectView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = BranchTransferRejectSerializer

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            transfer_request = get_transfer_request_or_404(pk)
            updated_request = reject_transfer(
                request.user,
                transfer_request=transfer_request,
                rejection_reason=serializer.validated_data["rejection_reason"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            BranchTransferRequestSerializer(updated_request).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        summary="Switch Subprogram",
        tags=["Academic - Enrollment"],
        request=SwitchSubProgramSerializer,
    ),
)
class EnrollmentSwitchSubProgramView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = SwitchSubProgramSerializer

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            enrollment = get_enrollment_or_404(pk)
            target_class = get_active_class_or_404(serializer.validated_data["target_class"])

            new_enrollment, amount_due = switch_subprogram(
                request.user,
                current_enrollment=enrollment,
                target_class=target_class,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            {
                "old_enrollment": EnrollmentSerializer(enrollment).data,
                "new_enrollment": EnrollmentSerializer(new_enrollment).data,
                "amount_due": amount_due,
            },
            status=status.HTTP_200_OK,
        )
