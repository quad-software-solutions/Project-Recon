from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import Branch
from apps.store.models import Product, ProductCategory
from apps.store.models.shopping_cart import ShoppingCart, ShoppingCartItem


CART_EXPIRY_DAYS = 30


def get_or_create_cart(user=None, session_key=None) -> ShoppingCart:
    if user:
        cart, _ = ShoppingCart.objects.get_or_create(
            user=user,
            defaults={"expires_at": timezone.now() + timedelta(days=CART_EXPIRY_DAYS)},
        )
        return cart
    if session_key:
        cart, _ = ShoppingCart.objects.get_or_create(
            session_key=session_key,
            defaults={"expires_at": timezone.now() + timedelta(days=CART_EXPIRY_DAYS)},
        )
        return cart
    raise ValidationError("Either user or session_key must be provided.")


def get_cart_items(cart: ShoppingCart):
    return ShoppingCartItem.objects.filter(cart=cart).select_related(
        "product__category", "branch"
    )


def _resolve_product(product_input):
    if isinstance(product_input, Product):
        return product_input
    try:
        return Product.objects.get(pk=product_input)
    except Product.DoesNotExist:
        raise ValidationError("Product not found.")


def _resolve_branch(branch_input):
    if isinstance(branch_input, Branch):
        return branch_input
    try:
        return Branch.objects.get(pk=branch_input)
    except Branch.DoesNotExist:
        raise ValidationError("Branch not found.")


def _get_available_quantity(branch: Branch, product: Product) -> int:
    from apps.store.models import BranchInventory

    try:
        return BranchInventory.objects.get(branch=branch, product=product).quantity
    except BranchInventory.DoesNotExist:
        return 0


def _touch_cart(cart: ShoppingCart):
    cart.expires_at = timezone.now() + timedelta(days=CART_EXPIRY_DAYS)
    cart.save(update_fields=["expires_at", "updated_at"])


def add_to_cart(
    cart: ShoppingCart,
    product_input,
    branch_input,
    quantity: int,
    actor=None,
) -> ShoppingCartItem:
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    product = _resolve_product(product_input)
    if not product.is_active or product.archived_at is not None:
        raise ValidationError("Product is not available for purchase.")

    branch = _resolve_branch(branch_input)

    available = _get_available_quantity(branch, product)
    if quantity > available:
        raise ValidationError(
            f"Insufficient stock. Available: {available}, requested: {quantity}."
        )

    with transaction.atomic():
        item, created = ShoppingCartItem.objects.get_or_create(
            cart=cart,
            product=product,
            branch=branch,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])

    _touch_cart(cart)
    return item


def remove_from_cart(
    cart: ShoppingCart, item_id, actor=None
) -> None:
    try:
        item = ShoppingCartItem.objects.get(pk=item_id, cart=cart)
    except ShoppingCartItem.DoesNotExist:
        raise NotFound("Cart item not found.")
    item.delete()
    _touch_cart(cart)


def update_cart_item_quantity(
    cart: ShoppingCart, item_id, quantity: int, actor=None
) -> ShoppingCartItem:
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    try:
        item = ShoppingCartItem.objects.get(pk=item_id, cart=cart)
    except ShoppingCartItem.DoesNotExist:
        raise NotFound("Cart item not found.")

    branch = item.branch
    product = item.product

    from apps.store.models import BranchInventory

    try:
        inv = BranchInventory.objects.get(branch=branch, product=product)
    except BranchInventory.DoesNotExist:
        raise ValidationError("Product is no longer available at this branch.")

    if quantity > inv.quantity:
        raise ValidationError(
            f"Insufficient stock. Available: {inv.quantity}, requested: {quantity}."
        )

    with transaction.atomic():
        item.quantity = quantity
        item.save(update_fields=["quantity"])

    _touch_cart(cart)
    return item


def clear_cart(cart: ShoppingCart, actor=None) -> None:
    cart.items.all().delete()
    _touch_cart(cart)


def delete_expired_carts() -> int:
    now = timezone.now()
    expired = ShoppingCart.objects.filter(expires_at__lt=now)
    count, _ = expired.delete()
    return count
