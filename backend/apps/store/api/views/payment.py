import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.serializers.payment import (
    PaymentVerifySerializer,
    StorePaymentSerializer,
)
from apps.store.services.payment_service import verify_store_payment

logger = logging.getLogger(__name__)


class PaymentVerifyView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PaymentVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = verify_store_payment(
            reference=serializer.validated_data["reference"]
        )
        return Response(StorePaymentSerializer(payment).data)


class PaymentWebhookView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        reference = request.data.get("tx_ref") or request.data.get("reference")
        if not reference:
            return Response(
                {"error": "Missing transaction reference."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            verify_store_payment(reference=reference)
        except Exception as e:
            logger.error("Webhook verification failed for %s: %s", reference, e)
            return Response({"status": "error"}, status=status.HTTP_200_OK)

        return Response({"status": "success"}, status=status.HTTP_200_OK)
