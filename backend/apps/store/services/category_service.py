from django.db import transaction
from django.db.models import Count
from rest_framework.exceptions import NotFound, ValidationError

from apps.store.models import ProductCategory


def get_category_or_404(pk):
    try:
        return ProductCategory.objects.get(pk=pk)
    except ProductCategory.DoesNotExist:
        raise NotFound("Category not found.")

def list_categories():
    return ProductCategory.objects.annotate(
        product_count=Count("products")
    ).order_by("name")



def list_active_categories():
    return ProductCategory.objects.filter(is_active=True).annotate(
        product_count=Count("products")
    ).order_by("name")


def create_category(data: dict, actor=None) -> ProductCategory:
    name = data.get("name", "").strip()
    if ProductCategory.objects.filter(name__iexact=name).exists():
        raise ValidationError("A category with this name already exists.")
    with transaction.atomic():
        return ProductCategory.objects.create(
            name=name,
            description=data.get("description", ""),
        )


def update_category(category: ProductCategory, data: dict, actor=None) -> ProductCategory:
    name = data.get("name")
    if name:
        name = name.strip()
        exists = (
            ProductCategory.objects.filter(name__iexact=name)
            .exclude(pk=category.pk)
            .exists()
        )
        if exists:
            raise ValidationError("A category with this name already exists.")
    with transaction.atomic():
        for key, value in data.items():
            setattr(category, key, value)
        category.save(update_fields=list(data.keys()))
    return category


def activate_category(category: ProductCategory, actor=None) -> ProductCategory:
    with transaction.atomic():
        category.is_active = True
        category.save(update_fields=["is_active", "updated_at"])
    return category


def deactivate_category(category: ProductCategory, actor=None) -> ProductCategory:
    with transaction.atomic():
        category.is_active = False
        category.save(update_fields=["is_active", "updated_at"])
    return category
