from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.store.models import Product, ProductCategory


def get_product_or_404(pk):
    try:
        return Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        raise NotFound("Product not found.")


def get_product_by_slug_or_404(slug):
    try:
        return Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        raise NotFound("Product not found.")


def list_products():
    return Product.objects.select_related("category").all()


def list_active_products():
    return Product.objects.select_related("category").filter(
        is_active=True, archived_at__isnull=True
    )


def _resolve_category(category_input):
    if isinstance(category_input, ProductCategory):
        return category_input
    try:
        return ProductCategory.objects.get(pk=category_input)
    except ProductCategory.DoesNotExist:
        raise ValidationError("Category not found.")


def create_product(data: dict, actor=None) -> Product:
    category_id = data.pop("category", None)
    if category_id:
        category = _resolve_category(category_id)
        if not category.is_active:
            raise ValidationError(
                "Cannot create products in an inactive category."
            )
        data["category"] = category

    sku = data.get("sku", "").strip()
    if Product.objects.filter(sku__iexact=sku).exists():
        raise ValidationError("A product with this SKU already exists.")

    slug = data.get("slug", "").strip()
    if Product.objects.filter(slug__iexact=slug).exists():
        raise ValidationError("A product with this slug already exists.")

    with transaction.atomic():
        return Product.objects.create(**data)


def update_product(product: Product, data: dict, actor=None) -> Product:
    sku = data.get("sku")
    if sku:
        sku = sku.strip()
        exists = (
            Product.objects.filter(sku__iexact=sku)
            .exclude(pk=product.pk)
            .exists()
        )
        if exists:
            raise ValidationError("A product with this SKU already exists.")

    slug = data.get("slug")
    if slug:
        slug = slug.strip()
        exists = (
            Product.objects.filter(slug__iexact=slug)
            .exclude(pk=product.pk)
            .exists()
        )
        if exists:
            raise ValidationError("A product with this slug already exists.")

    category_id = data.get("category")
    if category_id:
        if not isinstance(category_id, ProductCategory):
            category = _resolve_category(category_id)
            if not category.is_active:
                raise ValidationError(
                    "Cannot move products to an inactive category."
                )
            data["category"] = category

    with transaction.atomic():
        for key, value in data.items():
            setattr(product, key, value)
        product.save(update_fields=list(data.keys()))
    return product


def archive_product(product: Product, actor=None) -> Product:
    with transaction.atomic():
        product.archived_at = timezone.now()
        product.is_active = False
        product.save(update_fields=["archived_at", "is_active", "updated_at"])
    return product


def restore_product(product: Product, actor=None) -> Product:
    with transaction.atomic():
        product.archived_at = None
        product.is_active = True
        product.save(update_fields=["archived_at", "is_active", "updated_at"])
    return product


def activate_product(product: Product, actor=None) -> Product:
    if product.archived_at:
        raise ValidationError("Cannot activate an archived product. Restore it first.")
    with transaction.atomic():
        product.is_active = True
        product.save(update_fields=["is_active", "updated_at"])
    return product


def deactivate_product(product: Product, actor=None) -> Product:
    with transaction.atomic():
        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
    return product
