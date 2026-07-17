import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.academic.constants import PaymentMethod, PaymentStatus


class EnrollmentPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.OneToOneField(
        "academic.Enrollment", on_delete=models.PROTECT, related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, db_index=True
    )
    transaction_reference = models.CharField(
        max_length=255, blank=True, default="", db_index=True
    )
    bank_name = models.CharField(max_length=255, blank=True, default="")
    transfer_reference = models.CharField(max_length=255, blank=True, default="")
    attachment = models.FileField(
        upload_to="payment_attachments/", null=True, blank=True
    )
    payment_date = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="verified_payments",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Enrollment Payment"
        verbose_name_plural = "Enrollment Payments"

    def __str__(self):
        return f"Payment for {self.enrollment} — {self.get_status_display()}"

    def clean(self):
        if self.amount is not None and self.amount <= 0:
            raise ValidationError({"amount": "Payment amount must be greater than zero."})
        if self.payment_method != PaymentMethod.CASH:
            if not self.transaction_reference and not self.attachment:
                raise ValidationError(
                    "At least a transaction reference or payment attachment "
                    "is required for non-cash payments."
                )
