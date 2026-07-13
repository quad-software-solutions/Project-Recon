import uuid

from django.conf import settings
from django.db import models

from apps.accounts.models import Branch
from apps.store.models.product import Product


class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    PREPARING = "PREPARING"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


ORDER_STATUS_TRANSITIONS = {
    OrderStatus.PENDING_PAYMENT: [OrderStatus.PAID],
    OrderStatus.PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    OrderStatus.PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
    OrderStatus.READY_FOR_PICKUP: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    OrderStatus.COMPLETED: [OrderStatus.REFUNDED],
}


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="store_orders",
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="store_orders"
    )
    payment_reference = models.CharField(max_length=255, unique=True, db_index=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING_PAYMENT,
        db_index=True,
    )
    paid_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    guest_name = models.CharField(max_length=255, blank=True, default="")
    guest_email = models.EmailField(max_length=255, blank=True, default="")
    guest_phone = models.CharField(max_length=20, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_order"
        indexes = [
            models.Index(fields=["branch"], name="order_branch_idx"),
            models.Index(fields=["created_at"], name="order_created_at_idx"),
            models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="order_items"
    )
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "store_order_item"
        indexes = [
            models.Index(fields=["order"], name="oi_order_idx"),
            models.Index(fields=["product"], name="oi_product_idx"),
        ]

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history"
    )
    previous_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="order_status_changes",
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "store_order_status_history"
        indexes = [
            models.Index(fields=["order"], name="osh_order_idx"),
            models.Index(fields=["changed_at"], name="osh_changed_at_idx"),
        ]

    def __str__(self):
        prev = self.previous_status or "(none)"
        return f"{prev} → {self.new_status}"
