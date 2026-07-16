import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.store.constants import PaymentMethod, PaymentStatus
from apps.store.models.pending_order import PendingOrder


class StorePayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pending_order = models.OneToOneField(
        PendingOrder, on_delete=models.CASCADE, related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        db_index=True,
    )
    transaction_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        db_index=True,
    )
    bank_name = models.CharField(max_length=255, blank=True, default="")
    attachment = models.FileField(
        upload_to="payment_attachments/", null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING_VERIFICATION,
        db_index=True,
    )
    payment_date = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="verified_store_payments",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "store_payment"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment for {self.pending_order} — {self.get_status_display()}"

    def clean(self):
        if self.amount is not None and self.amount <= 0:
            raise ValidationError({"amount": "Payment amount must be greater than zero."})
        if self.payment_method != PaymentMethod.CASH:
            if not self.transaction_reference and not self.attachment:
                raise ValidationError(
                    "At least a transaction reference or payment attachment "
                    "is required for non-cash payments."
                )
