import uuid

from django.db import models

from apps.store.models.product import Product


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="store/products/")
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_product_image"
        ordering = ["display_order"]
        unique_together = [["product", "display_order"]]
        indexes = [
            models.Index(fields=["product"], name="pi_product_idx"),
        ]

    def __str__(self):
        return f"{self.product.name} - Image {self.display_order}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
