import uuid

from django.conf import settings
from django.db import models

from apps.accounts.models import Branch
from apps.store.models.product import Product


class PendingOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pending_orders",
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="pending_orders"
    )
    payment_reference = models.CharField(max_length=255, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    guest_name = models.CharField(max_length=255, blank=True, default="")
    guest_email = models.EmailField(max_length=255, blank=True, default="")
    guest_phone = models.CharField(max_length=20, blank=True, default="")
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_pending_order"
        indexes = [
            models.Index(fields=["expires_at"], name="po_expires_at_idx"),
            models.Index(fields=["payment_reference"], name="po_payment_ref_idx"),
        ]

    def __str__(self):
        owner = self.user.email if self.user else self.guest_name or "Guest"
        return f"PendingOrder {self.pk} ({owner})"


class PendingOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pending_order = models.ForeignKey(
        PendingOrder, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="pending_order_items"
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "store_pending_order_item"
        indexes = [
            models.Index(fields=["pending_order"], name="poi_pending_order_idx"),
            models.Index(fields=["product"], name="poi_product_idx"),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
