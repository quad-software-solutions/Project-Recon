import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.api.serializers.payment import (
    PaymentCashSerializer,
    PaymentEvidenceSerializer,
    PaymentRejectSerializer,
    PaymentVerifySerializer,
    StorePaymentSerializer,
)
from apps.store.models.pending_order import PendingOrder
from apps.store.services.payment_service import (
    get_payment_or_404,
    list_payments,
    record_cash_payment,
    reject_payment,
    submit_payment_evidence,
    verify_payment,
)
from apps.store.services.pending_order_service import get_pending_order_or_404

logger = logging.getLogger(__name__)


class PaymentEvidenceSubmitView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PaymentEvidenceSerializer

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        serializer = PaymentEvidenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = submit_payment_evidence(
            pending_order=pending_order,
            amount=serializer.validated_data["amount"],
            payment_method=serializer.validated_data["payment_method"],
            transaction_reference=serializer.validated_data.get(
                "transaction_reference", ""
            ),
            bank_name=serializer.validated_data.get("bank_name", ""),
            attachment=serializer.validated_data.get("attachment"),
            actor=request.user,
        )
        return Response(
            StorePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class AdminPaymentListView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = StorePaymentSerializer

    def get(self, request, *args, **kwargs):
        status_filter = request.query_params.get("status")
        pending_order_id = request.query_params.get("pending_order_id")
        payments = list_payments(
            status=status_filter, pending_order_id=pending_order_id
        )
        serializer = StorePaymentSerializer(payments, many=True)
        return Response(serializer.data)


class AdminPaymentVerifyView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = PaymentVerifySerializer

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = verify_payment(
            pending_order=pending_order,
            actor=request.user,
            verification_notes=serializer.validated_data.get(
                "verification_notes", ""
            ),
        )
        return Response(StorePaymentSerializer(payment).data)


class AdminPaymentRejectView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = PaymentRejectSerializer

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        serializer = PaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = reject_payment(
            pending_order=pending_order,
            actor=request.user,
            verification_notes=serializer.validated_data["verification_notes"],
        )
        return Response(StorePaymentSerializer(payment).data)


class AdminPaymentCashView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = PaymentCashSerializer

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        serializer = PaymentCashSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = record_cash_payment(
            pending_order=pending_order,
            amount=serializer.validated_data["amount"],
            actor=request.user,
            payment_date=serializer.validated_data.get("payment_date"),
        )
        return Response(
            StorePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )
