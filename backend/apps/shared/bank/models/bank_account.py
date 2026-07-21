import uuid

from django.db import models


class BankAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_name = models.CharField(max_length=200)
    account_holder = models.CharField(max_length=200)
    account_number = models.CharField(max_length=100)
    branch = models.CharField(max_length=200, blank=True, default="")
    swift_code = models.CharField(max_length=50, blank=True, default="")
    iban = models.CharField(max_length=50, blank=True, default="")
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "shared_bank_account"
        ordering = ["bank_name", "account_holder"]
        constraints = [
            models.UniqueConstraint(
                fields=["bank_name", "account_number"],
                name="uq_bank_name_account_number",
            ),
        ]

    def __str__(self):
        return f"{self.bank_name} — {self.account_holder} ({self.account_number})"
