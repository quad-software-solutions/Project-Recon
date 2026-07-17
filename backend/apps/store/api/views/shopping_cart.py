from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.store.api.serializers.shopping_cart import (
    CartAddItemSerializer,
    CartUpdateItemSerializer,
    ShoppingCartItemSerializer,
    ShoppingCartSerializer,
)
from apps.store.models.shopping_cart import ShoppingCartItem
from apps.store.services.shopping_cart_service import (
    add_to_cart,
    clear_cart,
    get_cart_items,
    get_or_create_cart,
    remove_from_cart,
    update_cart_item_quantity,
)


def _resolve_cart(request):
    if request.user.is_authenticated:
        return get_or_create_cart(user=request.user)
    session_key = request.headers.get("X-Session-Key")
    if session_key:
        return get_or_create_cart(session_key=session_key)
    raise ValidationError("Authentication or session key is required.")


class CartDetailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
        serializer = ShoppingCartSerializer(cart)
        return Response(serializer.data)


class CartAddItemView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CartAddItemSerializer

    def post(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
        serializer = CartAddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = add_to_cart(
            cart,
            serializer.validated_data["product"],
            serializer.validated_data["branch"],
            serializer.validated_data["quantity"],
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(
            ShoppingCartItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class CartItemUpdateView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CartUpdateItemSerializer

    def patch(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
        serializer = CartUpdateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = update_cart_item_quantity(
            cart,
            self.kwargs["pk"],
            serializer.validated_data["quantity"],
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(ShoppingCartItemSerializer(item).data)


class CartItemRemoveView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def delete(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
        remove_from_cart(
            cart,
            self.kwargs["pk"],
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def delete(self, request, *args, **kwargs):
        cart = _resolve_cart(request)
        clear_cart(
            cart,
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
