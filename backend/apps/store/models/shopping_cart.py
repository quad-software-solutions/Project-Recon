import uuid

from django.conf import settings
from django.db import models

from apps.accounts.models import Branch
from apps.store.models.product import Product


class ShoppingCart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="shopping_carts",
    )
    session_key = models.CharField(max_length=255, null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "store_shopping_cart"
        indexes = [
            models.Index(fields=["user"], name="sc_user_idx"),
            models.Index(fields=["session_key"], name="sc_session_key_idx"),
            models.Index(fields=["expires_at"], name="sc_expires_at_idx"),
        ]

    def __str__(self):
        if self.user:
            return f"Cart ({self.user.email})"
        return f"Cart (session: {self.session_key})"


class ShoppingCartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(
        ShoppingCart, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="cart_items"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_shopping_cart_item"
        unique_together = [["cart", "product", "branch"]]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="cart_item_quantity_gt_zero",
            )
        ]
        indexes = [
            models.Index(fields=["cart"], name="sci_cart_idx"),
            models.Index(fields=["product"], name="sci_product_idx"),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity} @ {self.branch.name}"
