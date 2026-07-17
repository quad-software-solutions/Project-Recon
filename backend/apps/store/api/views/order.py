from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.api.serializers.order import (
    OrderSerializer,
    OrderStatusSerializer,
)
from apps.store.services.order_service import (
    change_order_status,
    get_admin_orders,
    get_order_or_404,
    get_user_orders,
)


class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return get_admin_orders()


class AdminOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = OrderSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        return get_order_or_404(self.kwargs["pk"])


class AdminOrderStatusView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]
    serializer_class = OrderStatusSerializer

    def post(self, request, *args, **kwargs):
        order = get_order_or_404(self.kwargs["pk"])
        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = change_order_status(
            order,
            serializer.validated_data["status"],
            actor=request.user,
            notes=serializer.validated_data.get("notes", ""),
        )
        return Response(OrderSerializer(order).data)


class UserOrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return get_user_orders(self.request.user)


class UserOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        order = get_order_or_404(self.kwargs["pk"])
        if order.user and order.user.pk != self.request.user.pk:
            from rest_framework.exceptions import NotFound
            raise NotFound("Order not found.")
        return order
