import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Branch
from apps.shared.email.services import send_email
from apps.store.models import Product
from apps.store.models.pending_order import PendingOrder, PendingOrderItem
from apps.store.services.branch_inventory_service import validate_stock

logger = logging.getLogger(__name__)


def checkout(cart, branch_input, actor=None, guest_info: dict = None, payment_data: dict = None) -> PendingOrder:
    """
    Checkout: create a PendingOrder from a shopping cart.

    If payment_data is provided (customer submits evidence during checkout),
    a StorePayment is created in PENDING_VERIFICATION status.

    Args:
        cart: ShoppingCart instance.
        branch_input: Branch UUID or Branch instance.
        actor: Optional User performing the action.
        guest_info: Optional dict with guest name/email/phone.
        payment_data: Optional dict with payment evidence fields
                      (amount, payment_method, transaction_reference,
                       bank_name, attachment).

    Returns:
        Created PendingOrder instance.

    Raises:
        ValidationError: If cart is empty, products unavailable,
                         or insufficient stock.
    """
    items_qs = cart.items.select_related("product__category")
    if not items_qs.exists():
        raise ValidationError("Cannot checkout with an empty cart.")

    branch = _resolve_branch(branch_input)

    subtotal = 0
    for cart_item in items_qs:
        product = cart_item.product
        qty = cart_item.quantity

        if not product.is_active or product.archived_at is not None:
            raise ValidationError(
                f"Product '{product.name}' is not available for purchase."
            )

        if not validate_stock(branch, product, qty):
            from apps.store.models import BranchInventory
            try:
                inv = BranchInventory.objects.get(branch=branch, product=product)
                available = inv.quantity
            except BranchInventory.DoesNotExist:
                available = 0
            raise ValidationError(
                f"Insufficient stock for '{product.name}'. "
                f"Available: {available}, requested: {qty}."
            )

        subtotal += product.price * qty

    total = subtotal
    expires_at = timezone.now() + timedelta(minutes=30)

    send_otp = False

    with transaction.atomic():
        order = PendingOrder.objects.create(
            user=cart.user if cart.user_id else None,
            branch=branch,
            payment_reference=None,
            subtotal=subtotal,
            total=total,
            guest_name=(guest_info or {}).get("name", ""),
            guest_email=(guest_info or {}).get("email", ""),
            guest_phone=(guest_info or {}).get("phone", ""),
            expires_at=expires_at,
        )

        for cart_item in items_qs:
            PendingOrderItem.objects.create(
                pending_order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                unit_price=cart_item.product.price,
                subtotal=cart_item.product.price * cart_item.quantity,
            )

        if payment_data:
            from apps.store.services.payment_service import submit_payment_evidence

            submit_payment_evidence(
                pending_order=order,
                amount=payment_data.get("amount"),
                payment_method=payment_data.get("payment_method"),
                transaction_reference=payment_data.get("transaction_reference", ""),
                bank_name=payment_data.get("bank_name", ""),
                attachment=payment_data.get("attachment"),
                actor=actor,
            )

        cart.items.all().delete()

        if not order.user and order.guest_email:
            otp = get_random_string(length=6, allowed_chars="0123456789")
            order.email_verification_otp = make_password(otp)
            order.email_verification_otp_expiry = timezone.now() + timedelta(minutes=10)
            order.save(update_fields=["email_verification_otp", "email_verification_otp_expiry"])
            send_email(
                to=order.guest_email,
                subject="Verify your email for your order",
                body=(
                    f"Hello {order.guest_name or 'Valued Customer'},\n\n"
                    f"Your verification code is: {otp}\n\n"
                    f"This code expires in 10 minutes.\n"
                    f"Use it to verify your email before submitting payment."
                ),
            )

    return PendingOrder.objects.prefetch_related(
        "items__product__category"
    ).get(pk=order.pk)


def _resolve_branch(branch_input) -> Branch:
    if isinstance(branch_input, Branch):
        return branch_input
    try:
        return Branch.objects.get(pk=branch_input)
    except Branch.DoesNotExist:
        raise ValidationError("Branch not found.")
