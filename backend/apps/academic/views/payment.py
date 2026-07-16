import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

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


@extend_schema_view(
    get=extend_schema(summary="List Payments", tags=["Academic - Payments"]),
)
class PaymentListView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPaymentListSerializer

    def get(self, request):
        payments = list_payments()
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Record Payment (Verify)", tags=["Academic - Payments"]),
)
class PaymentCreateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = PaymentSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        enrollment = get_object_or_404(Enrollment, pk=data.pop("enrollment"))

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

    def get(self, request):
        enrollments = Enrollment.objects.filter(
            status=EnrollmentStatus.PENDING_VERIFICATION,
            verification_status__in=[
                VerificationStatus.SUBMITTED,
                VerificationStatus.UNDER_REVIEW,
            ],
        ).select_related(
            "student__user", "enrolled_class__sub_program", "enrolled_class__branch"
        )

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

    def post(self, request, pk):
        enrollment = get_object_or_404(Enrollment, pk=pk)
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

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment = get_object_or_404(Enrollment, pk=pk)
        try:
            reject_payment(
                request.user,
                enrollment=enrollment,
                rejection_reason=serializer.validated_data["rejection_reason"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response({"status": "REJECTED"}, status=status.HTTP_200_OK)
