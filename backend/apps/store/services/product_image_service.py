from django.db import transaction
from rest_framework.exceptions import NotFound

from apps.store.models import Product, ProductImage


def get_image_or_404(pk):
    try:
        return ProductImage.objects.select_related("product").get(pk=pk)
    except ProductImage.DoesNotExist:
        raise NotFound("Product image not found.")


def list_product_images(product: Product):
    return ProductImage.objects.filter(product=product).order_by("display_order")


def upload_image(
    product: Product,
    image_file,
    alt_text: str = None,
    is_primary: bool = False,
    actor=None,
) -> ProductImage:
    max_order = (
        ProductImage.objects.filter(product=product)
        .order_by("display_order")
        .last()
    )
    display_order = (max_order.display_order + 1) if max_order else 0
    with transaction.atomic():
        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            alt_text=alt_text or "",
            is_primary=is_primary,
            display_order=display_order,
        )
    return img


def delete_image(image: ProductImage, actor=None) -> None:
    product = image.product
    was_primary = image.is_primary
    with transaction.atomic():
        image.delete()
    if was_primary:
        _promote_next_image(product)


def set_primary_image(image: ProductImage, actor=None) -> ProductImage:
    with transaction.atomic():
        ProductImage.objects.filter(product=image.product, is_primary=True).exclude(
            pk=image.pk
        ).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=["is_primary"])
    return image


def reorder_images(product: Product, ordered_ids: list, actor=None) -> list[ProductImage]:
    images = ProductImage.objects.filter(product=product)
    id_map = {img.id: img for img in images}
    count = images.count()
    with transaction.atomic():
        for img in id_map.values():
            img.display_order = count + img.display_order
        ProductImage.objects.bulk_update(
            [img for img in id_map.values() if img is not None],
            ["display_order"],
        )
        for order, img_id in enumerate(ordered_ids):
            img = id_map.get(img_id)
            if img:
                img.display_order = order
        ProductImage.objects.bulk_update(
            [img for img in id_map.values() if img is not None],
            ["display_order"],
        )
    return ProductImage.objects.filter(product=product).order_by("display_order")


def _promote_next_image(product: Product) -> None:
    next_image = (
        ProductImage.objects.filter(product=product)
        .order_by("display_order")
        .first()
    )
    if next_image:
        next_image.is_primary = True
        next_image.save(update_fields=["is_primary"])
