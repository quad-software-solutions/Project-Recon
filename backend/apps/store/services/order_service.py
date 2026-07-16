import logging

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.shared.audit.services import log_action
from apps.store.constants import PaymentStatus
from apps.store.models.order import (
    ORDER_STATUS_TRANSITIONS,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusHistory,
)
from apps.store.models.pending_order import PendingOrder
from apps.store.services.branch_inventory_service import add_inventory, reduce_inventory

logger = logging.getLogger(__name__)


def generate_order_number(branch) -> str:
    year = timezone.now().year
    prefix = f"ORD-{branch.code}-{year}-"
    last_order = (
        Order.objects.filter(order_number__startswith=prefix)
        .order_by("order_number")
        .last()
    )
    if last_order:
        last_seq = int(last_order.order_number.split("-")[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1
    return f"{prefix}{next_seq:06d}"


def create_order_from_pending_order(
    pending_order: PendingOrder, actor=None
) -> Order:
    payment = getattr(pending_order, "payment", None)
    if not payment or payment.status != PaymentStatus.VERIFIED:
        raise ValidationError(
            "Cannot create an order from a pending order whose payment is not verified."
        )

    existing = Order.objects.filter(
        payment_reference=payment.transaction_reference or str(payment.id)
    ).first()
    if existing:
        return existing

    with transaction.atomic():
        order_number = generate_order_number(pending_order.branch)

        order = Order.objects.create(
            order_number=order_number,
            user=pending_order.user,
            branch=pending_order.branch,
            payment_reference=payment.transaction_reference or str(payment.id),
            subtotal=pending_order.subtotal,
            total=pending_order.total,
            status=OrderStatus.PAID,
            paid_at=timezone.now(),
            guest_name=pending_order.guest_name,
            guest_email=pending_order.guest_email,
            guest_phone=pending_order.guest_phone,
        )

        for poi in pending_order.items.select_related("product"):
            OrderItem.objects.create(
                order=order,
                product=poi.product,
                product_name=poi.product.name,
                sku=poi.product.sku,
                quantity=poi.quantity,
                unit_price=poi.unit_price,
                subtotal=poi.subtotal,
            )

        OrderStatusHistory.objects.create(
            order=order,
            previous_status=None,
            new_status=OrderStatus.PAID,
            changed_by=actor,
            notes="Order created after successful payment",
        )

        for poi in pending_order.items.select_related("product"):
            reduce_inventory(
                pending_order.branch, poi.product, poi.quantity, actor=actor
            )

    return Order.objects.prefetch_related(
        "items", "status_history"
    ).get(pk=order.pk)


def get_order_or_404(pk) -> Order:
    try:
        return Order.objects.prefetch_related(
            "items", "status_history"
        ).get(pk=pk)
    except Order.DoesNotExist:
        raise NotFound("Order not found.")


def get_user_orders(user):
    return Order.objects.filter(user=user).prefetch_related("items").order_by("-created_at")


def get_admin_orders():
    return Order.objects.select_related("branch").prefetch_related("items").order_by("-created_at")


def change_order_status(
    order: Order, new_status: str, actor=None, notes: str = ""
) -> Order:
    if new_status not in OrderStatus.values:
        raise ValidationError(f"Invalid status: {new_status}")

    allowed = ORDER_STATUS_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise ValidationError(
            f"Cannot transition from '{order.status}' to '{new_status}'."
        )

    previous_status = order.status

    with transaction.atomic():
        order.status = new_status
        if new_status == OrderStatus.COMPLETED:
            order.completed_at = timezone.now()
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = timezone.now()
        elif new_status == OrderStatus.REFUNDED:
            order.refunded_at = timezone.now()
        order.save(update_fields=["status", "completed_at", "cancelled_at", "refunded_at"])

        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=actor,
            notes=notes,
        )

        if new_status in (OrderStatus.CANCELLED, OrderStatus.REFUNDED):
            for item in order.items.select_related("product"):
                add_inventory(order.branch, item.product, item.quantity, actor=actor)

    log_action(
        actor=actor,
        action="ORDER_STATUS_CHANGED",
        resource_type="Order",
        resource_id=str(order.pk),
        details={
            "order_number": order.order_number,
            "previous_status": previous_status,
            "new_status": new_status,
            "notes": notes,
        },
    )

    if new_status == OrderStatus.READY_FOR_PICKUP:
        from apps.store.services.notification_service import notify_ready_for_pickup
        notify_ready_for_pickup(order)
    elif new_status == OrderStatus.COMPLETED:
        from apps.store.services.notification_service import notify_order_completed
        notify_order_completed(order)
    elif new_status == OrderStatus.CANCELLED:
        from apps.store.services.notification_service import notify_cancelled
        notify_cancelled(order)
    elif new_status == OrderStatus.REFUNDED:
        from apps.store.services.notification_service import notify_refund
        notify_refund(order)

    return order
