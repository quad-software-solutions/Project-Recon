import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.academic.models import Enrollment
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentPaymentSerializer,
    EnrollmentPaymentListSerializer,
    CashPaymentSerializer,
    OnlinePaymentVerifySerializer,
)
from apps.academic.services.payment_service import (
    create_cash_payment,
    verify_online_payment,
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
    post=extend_schema(summary="Create Cash Payment", tags=["Academic - Payments"]),
)
class CashPaymentCreateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = CashPaymentSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        enrollment = get_object_or_404(Enrollment, pk=data.pop("enrollment"))

        try:
            payment = create_cash_payment(
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
    post=extend_schema(summary="Verify Online Payment", tags=["Academic - Payments"]),
)
class OnlinePaymentVerifyView(generics.GenericAPIView):
    serializer_class = OnlinePaymentVerifySerializer
    permission_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reference = serializer.validated_data["reference"]
        try:
            payment = verify_online_payment(reference=reference)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            EnrollmentPaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(summary="Online Payment Webhook", tags=["Academic - Payments"]),
)
class OnlinePaymentWebhookView(generics.GenericAPIView):
    serializer_class = OnlinePaymentVerifySerializer
    permission_classes = []

    def post(self, request):
        reference = request.data.get("tx_ref") or request.data.get("reference")
        if not reference:
            return Response(
                {"error": "Missing transaction reference."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verify_online_payment(reference=reference)
        except Exception as e:
            logger.error("Webhook verification failed for %s: %s", reference, e)
            return Response({"status": "error"}, status=status.HTTP_200_OK)

        return Response({"status": "success"}, status=status.HTTP_200_OK)
