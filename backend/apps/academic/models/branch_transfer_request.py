import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class BranchTransferRequest(models.Model):
    class TransferStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        "academic.Enrollment", on_delete=models.CASCADE,
        related_name="branch_transfer_requests"
    )
    from_branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT,
        related_name="outgoing_transfer_requests"
    )
    to_branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT,
        related_name="incoming_transfer_requests"
    )
    target_class = models.ForeignKey(
        "academic.Class", on_delete=models.PROTECT,
        related_name="incoming_transfer_requests"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="initiated_transfer_requests"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="approved_transfer_requests"
    )
    status = models.CharField(
        max_length=20, choices=TransferStatus.choices,
        default=TransferStatus.PENDING, db_index=True
    )
    rejection_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "academic_branch_transfer_request"
        ordering = ["-created_at"]

    def clean(self):
        if self.to_branch_id == self.from_branch_id:
            raise ValidationError("Destination branch must differ from source branch.")
        if self.target_class.branch_id != self.to_branch_id:
            raise ValidationError("Target class must belong to the destination branch.")
        if not self.target_class.is_active:
            raise ValidationError("Target class is not active.")
        if self.enrollment.status not in ["ACTIVE"]:
            raise ValidationError("Enrollment must be active.")
        if type(self).objects.filter(
            enrollment=self.enrollment,
            status=self.TransferStatus.PENDING,
        ).exclude(pk=self.pk).exists():
            raise ValidationError("A pending transfer request already exists for this enrollment.")

    def __str__(self):
        return f"Transfer {self.enrollment} ({self.from_branch} → {self.to_branch}) [{self.status}]"
