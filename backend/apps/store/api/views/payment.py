from rest_framework import generics, status
from rest_framework.exceptions import NotFound as DRFNotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions.roles import get_active_branch_ids, user_is_branch_manager, user_is_super_admin
from apps.store.api.auth_helpers import check_pending_order_access, filter_by_branch
from apps.store.api.permissions import IsStoreStaff, IsStoreStaffOrManager
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


class PaymentEvidenceSubmitView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PaymentEvidenceSerializer
    throttle_scope = "store_checkout"

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        check_pending_order_access(pending_order, request)

        if pending_order.guest_email and not pending_order.email_verified:
            raise ValidationError(
                "Please verify your email before submitting payment evidence."
            )

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
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(
            StorePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class AdminPaymentListView(generics.GenericAPIView):
    permission_classes = [IsStoreStaffOrManager]
    serializer_class = StorePaymentSerializer
    throttle_scope = "store_admin"

    def get(self, request, *args, **kwargs):
        status_filter = request.query_params.get("status")
        pending_order_id = request.query_params.get("pending_order_id")
        payments = list_payments(
            status=status_filter, pending_order_id=pending_order_id
        )
        if user_is_branch_manager(request.user):
            payments = payments.filter(
                pending_order__branch_id__in=get_active_branch_ids(request.user)
            )
        serializer = StorePaymentSerializer(payments, many=True)
        return Response(serializer.data)


class AdminPaymentVerifyView(generics.GenericAPIView):
    permission_classes = [IsStoreStaffOrManager]
    serializer_class = PaymentVerifySerializer
    throttle_scope = "store_admin"

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        if not user_is_super_admin(request.user):
            if pending_order.branch_id not in get_active_branch_ids(request.user):
                raise DRFNotFound("Pending order not found.")
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
    permission_classes = [IsStoreStaffOrManager]
    serializer_class = PaymentRejectSerializer
    throttle_scope = "store_admin"

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        if not user_is_super_admin(request.user):
            if pending_order.branch_id not in get_active_branch_ids(request.user):
                raise DRFNotFound("Pending order not found.")
        serializer = PaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = reject_payment(
            pending_order=pending_order,
            actor=request.user,
            verification_notes=serializer.validated_data["verification_notes"],
        )
        return Response(StorePaymentSerializer(payment).data)


class AdminPaymentCashView(generics.GenericAPIView):
    permission_classes = [IsStoreStaffOrManager]
    serializer_class = PaymentCashSerializer
    throttle_scope = "store_admin"

    def post(self, request, *args, **kwargs):
        pending_order = get_pending_order_or_404(kwargs["pending_order_pk"])
        if not user_is_super_admin(request.user):
            if pending_order.branch_id not in get_active_branch_ids(request.user):
                raise DRFNotFound("Pending order not found.")
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
