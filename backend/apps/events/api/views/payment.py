from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.response import Response

from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin
from apps.events.api.permissions import IsEventRegistrationStaff
from apps.events.api.serializers import (
    CashPaymentSerializer,
    EventPaymentSerializer,
    PaymentRejectSerializer,
    PaymentVerifySerializer,
)
from apps.events.services.event_payment_service import (
    list_payments,
    record_cash_payment,
    reject_payment,
    verify_payment,
)
from apps.events.services.registration_service import get_registration_or_404


@extend_schema_view(
    post=extend_schema(
        tags=["Events - Admin - Payments"],
        summary="Record cash payment",
        description="Record a cash payment for a registration. "
                    "The payment is immediately marked as VERIFIED and the "
                    "registration is approved.",
    ),
)
class AdminCashPaymentView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        serializer = CashPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = record_cash_payment(
            registration,
            serializer.validated_data["amount"],
            actor=request.user,
            payment_date=serializer.validated_data.get("payment_date"),
        )
        return Response(
            EventPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Events - Admin - Payments"],
        summary="Verify payment",
        description="Verify a pending payment. Marks the payment as VERIFIED "
                    "and approves the registration.",
    ),
)
class AdminPaymentVerifyView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = verify_payment(
            registration,
            actor=request.user,
            verification_notes=serializer.validated_data.get("verification_notes", ""),
        )
        return Response(
            EventPaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Events - Admin - Payments"],
        summary="Reject payment",
        description="Reject a pending payment. Marks the payment as REJECTED "
                    "and rejects the registration. Verification notes are required.",
    ),
)
class AdminPaymentRejectView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        serializer = PaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = reject_payment(
            registration,
            actor=request.user,
            verification_notes=serializer.validated_data["verification_notes"],
        )
        return Response(
            EventPaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Events - Admin - Payments"],
        summary="List payments",
        description="Retrieve the payment queue, optionally filtered by event and status. "
                    "This is the Pending Verification Queue.",
        parameters=[
            OpenApiParameter(
                name="event",
                description="Filter by event ID",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="status",
                description="Filter by payment status",
                required=False,
                type=str,
            ),
        ],
    ),
)
class AdminPaymentListView(generics.ListAPIView):
    permission_classes = [IsEventRegistrationStaff]
    serializer_class = EventPaymentSerializer

    def get_queryset(self):
        event_id = self.request.query_params.get("event")
        status_filter = self.request.query_params.get("status")
        branch_ids = None
        if not user_is_super_admin(self.request.user):
            branch_ids = get_active_branch_ids(self.request.user)
        return list_payments(event_id=event_id, status=status_filter, branch_ids=branch_ids)
