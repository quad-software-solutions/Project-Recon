from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.serializers.checkout import (
    CheckoutInputSerializer,
    PendingOrderSerializer,
)
from apps.store.models.pending_order import PendingOrder
from apps.store.services.checkout_service import checkout
from apps.store.services.pending_order_service import get_pending_order_or_404
from apps.store.services.shopping_cart_service import get_or_create_cart


def _resolve_cart(request):
    if request.user.is_authenticated:
        return get_or_create_cart(user=request.user)
    session_key = request.headers.get("X-Session-Key")
    if session_key:
        return get_or_create_cart(session_key=session_key)
    raise ValidationError("Authentication or session key is required.")


class CheckoutView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CheckoutInputSerializer

    def post(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
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

    def get(self, request, *args, **kwargs):
        order = get_pending_order_or_404(self.kwargs["pk"])

        if order.user and request.user.is_authenticated:
            if order.user.pk != request.user.pk:
                return Response(
                    {"detail": "Not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif order.user and not request.user.is_authenticated:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        elif not order.user and not request.user.is_authenticated:
            session_key = request.headers.get("X-Session-Key")
            cart = get_or_create_cart(session_key=session_key)
            if order.guest_email != cart.user.email if cart.user_id else "":
                return Response(
                    {"detail": "Not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = PendingOrderSerializer(order)
        return Response(serializer.data)
