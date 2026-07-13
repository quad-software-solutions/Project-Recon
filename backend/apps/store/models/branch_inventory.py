import uuid

from django.db import models

from apps.accounts.models import Branch
from apps.store.models.product import Product


class BranchInventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="store_inventory"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="inventory_records"
    )
    quantity = models.IntegerField(default=0)
    minimum_quantity = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "store_branch_inventory"
        unique_together = [["branch", "product"]]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=0),
                name="inventory_quantity_gte_zero",
            )
        ]
        verbose_name_plural = "Branch inventories"

    def __str__(self):
        return f"{self.product.name} @ {self.branch.name} ({self.quantity})"
