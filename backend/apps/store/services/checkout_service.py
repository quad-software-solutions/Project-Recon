import logging
import re
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Branch
from apps.store.models import Product
from apps.store.models.pending_order import PendingOrder, PendingOrderItem
from apps.store.services.branch_inventory_service import validate_stock

logger = logging.getLogger(__name__)

REFERENCE_PREFIX = "STORE-"
REFERENCE_PATTERN = re.compile(rf"^{REFERENCE_PREFIX}[a-f0-9]{{8}}-[a-f0-9]{{12}}$")


def _generate_reference() -> str:
    import uuid
    return f"{REFERENCE_PREFIX}{uuid.uuid4().hex[:8]}-{uuid.uuid4().hex[:12]}"


def checkout(cart, branch_input, actor=None, guest_info: dict = None) -> PendingOrder:
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

        subtotal += float(product.price) * qty

    total = subtotal
    expires_at = timezone.now() + timedelta(minutes=30)

    payment_ref = _generate_reference()

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
                subtotal=float(cart_item.product.price) * cart_item.quantity,
            )

        try:
            from apps.shared.payment.payment_service import (
                initialize_payment as shared_initialize_payment,
            )
            from apps.shared.payment.exceptions import PaymentError

            customer = _build_customer(cart, guest_info)
            result = shared_initialize_payment(
                amount=order.total,
                currency="ETB",
                reference=payment_ref,
                callback_url="",  # Set via settings in Phase 5
                customer=customer,
            )
            order.payment_reference = result.get("reference") or payment_ref
            order.save(update_fields=["payment_reference"])
        except (ImportError, PaymentError) as e:
            logger.warning("Payment initialization skipped/failed: %s", e)

        cart.items.all().delete()

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


def _build_customer(cart, guest_info: dict = None) -> dict:
    if cart.user:
        return {
            "email": cart.user.email,
            "first_name": cart.user.first_name or "",
            "last_name": cart.user.last_name or "",
            "phone_number": "",
        }
    info = guest_info or {}
    name_parts = (info.get("name") or "").split(" ", 1)
    return {
        "email": info.get("email", ""),
        "first_name": name_parts[0] if name_parts else "",
        "last_name": name_parts[1] if len(name_parts) > 1 else "",
        "phone_number": info.get("phone", ""),
    }
