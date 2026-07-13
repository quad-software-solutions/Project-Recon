import uuid

from django.db import models

from apps.store.constants import PaymentMethod, PaymentProvider, PaymentStatus
from apps.store.models.pending_order import PendingOrder


class StorePayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pending_order = models.OneToOneField(
        PendingOrder, on_delete=models.CASCADE, related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.ONLINE,
    )
    payment_provider = models.CharField(
        max_length=10,
        choices=PaymentProvider.choices,
        null=True,
        blank=True,
    )
    transaction_reference = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    payment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_payment"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.transaction_reference} — {self.get_status_display()}"
