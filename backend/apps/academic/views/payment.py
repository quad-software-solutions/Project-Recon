from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rest_framework.exceptions import PermissionDenied

from apps.academic.constants import EnrollmentStatus, VerificationStatus
from apps.academic.models import Enrollment
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentPaymentSerializer,
    EnrollmentPaymentListSerializer,
    PaymentSerializer,
    RejectionSerializer,
)
from apps.academic.services.payment_service import (
    record_payment,
    reject_payment,
    set_under_review,
    list_payments,
    get_payment_or_404,
)
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin


@extend_schema_view(
    get=extend_schema(summary="List Payments", tags=["Academic - Payments"]),
)
class PaymentListView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPaymentListSerializer
    throttle_scope = "academic_staff"

    def get(self, request):
        branch_ids = None
        if not user_is_super_admin(request.user):
            branch_ids = get_active_branch_ids(request.user)
        payments = list_payments(branch_ids=branch_ids)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Record Payment (Verify)", tags=["Academic - Payments"]),
)
class PaymentCreateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = PaymentSerializer
    throttle_scope = "academic_staff"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        enrollment = get_object_or_404(Enrollment, pk=data.pop("enrollment"))

        branch_ids = get_active_branch_ids(request.user)
        if not user_is_super_admin(request.user) and enrollment.enrolled_class.branch_id not in branch_ids:
            raise PermissionDenied("You do not have access to this enrollment.")

        try:
            payment = record_payment(
                request.user,
                enrollment=enrollment,
                **data,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            EnrollmentPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(
        summary="List Pending Verification Queue",
        tags=["Academic - Payments"],
    ),
)
class EnrollmentVerificationQueueView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPaymentListSerializer
    throttle_scope = "academic_staff"

    def get(self, request):
        branch_ids = None
        if not user_is_super_admin(request.user):
            branch_ids = get_active_branch_ids(request.user)

        qs = Enrollment.objects.filter(
            status=EnrollmentStatus.PENDING_VERIFICATION,
            verification_status__in=[
                VerificationStatus.SUBMITTED,
                VerificationStatus.UNDER_REVIEW,
            ],
        ).select_related(
            "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
        )
        if branch_ids is not None:
            qs = qs.filter(enrolled_class__branch_id__in=branch_ids)
        enrollments = qs

        payments = [
            e.payment for e in enrollments
            if hasattr(e, "payment")
        ]

        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(
        summary="Mark Enrollment Under Review",
        tags=["Academic - Payments"],
    ),
)
class EnrollmentUnderReviewView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        enrollment = get_object_or_404(Enrollment, pk=pk)
        branch_ids = get_active_branch_ids(request.user)
        if not user_is_super_admin(request.user) and enrollment.enrolled_class.branch_id not in branch_ids:
            raise PermissionDenied("You do not have access to this enrollment.")
        try:
            set_under_review(request.user, enrollment=enrollment)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response({"status": "UNDER_REVIEW"}, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(
        summary="Reject Enrollment Payment",
        tags=["Academic - Payments"],
        request=RejectionSerializer,
    ),
)
class EnrollmentRejectView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = RejectionSerializer
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment = get_object_or_404(Enrollment, pk=pk)
        branch_ids = get_active_branch_ids(request.user)
        if not user_is_super_admin(request.user) and enrollment.enrolled_class.branch_id not in branch_ids:
            raise PermissionDenied("You do not have access to this enrollment.")
        try:
            reject_payment(
                request.user,
                enrollment=enrollment,
                rejection_reason=serializer.validated_data["rejection_reason"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response({"status": "REJECTED"}, status=status.HTTP_200_OK)
