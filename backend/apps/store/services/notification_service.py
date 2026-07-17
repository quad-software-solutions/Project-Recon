import logging

from django.conf import settings

from apps.shared.email.services import send_email
from apps.store.models.order import Order, OrderStatus
from apps.store.models.pending_order import PendingOrder

logger = logging.getLogger(__name__)


def _resolve_recipient(order: Order) -> str | None:
    if order.user and order.user.email:
        return order.user.email
    return order.guest_email or None


def _build_items_summary(order: Order) -> str:
    lines = []
    for item in order.items.all():
        lines.append(f"  {item.product_name} x{item.quantity} — ${item.subtotal:.2f}")
    return "\n".join(lines)


def notify_payment_and_order_confirmed(
    pending_order: PendingOrder, order: Order
) -> None:
    recipient = _resolve_recipient(order)
    if not recipient:
        logger.warning(
            "No recipient for payment confirmation (order %s)", order.order_number
        )
        return

    subject = f"Payment Confirmed — Order {order.order_number}"
    body = (
        f"Dear customer,\n\n"
        f"Your payment has been confirmed.\n\n"
        f"Order Number: {order.order_number}\n"
        f"Total: ${order.total:.2f}\n"
        f"Pickup Branch: {order.branch.name}\n\n"
        f"Items:\n{_build_items_summary(order)}\n\n"
        f"Your order is now being prepared. We will notify you when it is ready for pickup.\n\n"
        f"Thank you for your purchase!"
    )
    send_email(recipient, subject, body)


def notify_ready_for_pickup(order: Order) -> None:
    recipient = _resolve_recipient(order)
    if not recipient:
        logger.warning(
            "No recipient for ready-for-pickup notification (order %s)",
            order.order_number,
        )
        return

    subject = f"Ready for Pickup — Order {order.order_number}"
    body = (
        f"Dear customer,\n\n"
        f"Your order is ready for pickup!\n\n"
        f"Order Number: {order.order_number}\n"
        f"Pickup Branch: {order.branch.name}\n\n"
        f"Items:\n{_build_items_summary(order)}\n\n"
        f"Please visit the branch to collect your order."
    )
    send_email(recipient, subject, body)


def notify_order_completed(order: Order) -> None:
    recipient = _resolve_recipient(order)
    if not recipient:
        logger.warning(
            "No recipient for completion notification (order %s)", order.order_number
        )
        return

    subject = f"Order Completed — Order {order.order_number}"
    body = (
        f"Dear customer,\n\n"
        f"Your order has been completed.\n\n"
        f"Order Number: {order.order_number}\n"
        f"We hope you enjoy your purchase. Thank you for shopping with us!"
    )
    send_email(recipient, subject, body)


def notify_cancelled(order: Order) -> None:
    recipient = _resolve_recipient(order)
    if not recipient:
        logger.warning(
            "No recipient for cancellation notification (order %s)",
            order.order_number,
        )
        return

    subject = f"Order Cancelled — Order {order.order_number}"
    body = (
        f"Dear customer,\n\n"
        f"Your order has been cancelled.\n\n"
        f"Order Number: {order.order_number}\n"
        f"If you have any questions, please contact us."
    )
    send_email(recipient, subject, body)


def notify_refund(order: Order) -> None:
    recipient = _resolve_recipient(order)
    if not recipient:
        logger.warning(
            "No recipient for refund notification (order %s)", order.order_number
        )
        return

    subject = f"Refund Processed — Order {order.order_number}"
    body = (
        f"Dear customer,\n\n"
        f"A refund has been processed for your order.\n\n"
        f"Order Number: {order.order_number}\n"
        f"Amount Refunded: ${order.total:.2f}\n\n"
        f"If you have any questions, please contact us."
    )
    send_email(recipient, subject, body)
