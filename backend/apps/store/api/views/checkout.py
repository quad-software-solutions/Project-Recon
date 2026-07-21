from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.auth_helpers import check_pending_order_access, verify_cart_token
from apps.store.api.serializers.checkout import (
    CheckoutInputSerializer,
    PendingOrderSerializer,
    VerifyEmailSerializer,
)
from apps.store.models.pending_order import PendingOrder
from apps.store.services.checkout_service import checkout
from apps.store.services.pending_order_service import (
    get_pending_order_or_404,
    verify_guest_email,
)
from apps.store.services.shopping_cart_service import get_or_create_cart


def _resolve_cart(request, require_write_token=False):
    if request.user.is_authenticated:
        return get_or_create_cart(user=request.user)
    session_key = request.headers.get("X-Session-Key")
    if session_key:
        cart = get_or_create_cart(session_key=session_key)
        if require_write_token:
            token = request.headers.get("X-Cart-Token")
            if not token or not verify_cart_token(token, cart.id):
                raise ValidationError("Invalid or missing cart token.")
        return cart
    raise ValidationError("Authentication or session key is required.")


class CheckoutView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CheckoutInputSerializer
    throttle_scope = "store_checkout"

    def post(self, request, *args, **kwargs):
        cart = _resolve_cart(request, require_write_token=True)
        serializer = CheckoutInputSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        guest_info = None
        if not request.user.is_authenticated:
            guest_info = {
                "name": data.get("guest_name", ""),
                "email": data.get("guest_email", ""),
                "phone": data.get("guest_phone", ""),
            }

        payment_data = None
        pd = data.get("payment", {})
        if pd and pd.get("payment_method"):
            payment_data = {
                "amount": pd.get("amount"),
                "payment_method": pd.get("payment_method"),
                "transaction_reference": pd.get("transaction_reference", ""),
                "bank_name": pd.get("bank_name", ""),
                "attachment": request.FILES.get("payment_attachment"),
            }

        order = checkout(
            cart,
            data["branch"],
            actor=request.user if request.user.is_authenticated else None,
            guest_info=guest_info,
            payment_data=payment_data,
        )
        return Response(
            PendingOrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class PendingOrderDetailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PendingOrderSerializer
    throttle_scope = "store_public"

    def get(self, request, *args, **kwargs):
        order = get_pending_order_or_404(self.kwargs["pk"])
        check_pending_order_access(order, request)
        serializer = PendingOrderSerializer(order)
        return Response(serializer.data)


class PendingOrderVerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailSerializer
    throttle_scope = "store_public"

    def post(self, request, *args, **kwargs):
        order = get_pending_order_or_404(self.kwargs["pk"])
        check_pending_order_access(order, request)
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verify_guest_email(order, serializer.validated_data["otp"])
        return Response({"detail": "Email verified successfully."})
