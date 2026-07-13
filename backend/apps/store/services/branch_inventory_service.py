from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import Branch
from apps.store.models import BranchInventory, Product


def get_inventory_by_id_or_404(pk):
    try:
        return BranchInventory.objects.select_related("branch", "product__category").get(
            pk=pk
        )
    except BranchInventory.DoesNotExist:
        raise NotFound("Inventory record not found.")


def get_inventory_or_create(branch: Branch, product: Product):
    inv, _ = BranchInventory.objects.get_or_create(branch=branch, product=product)
    return inv


def get_branch_inventory(branch: Branch):
    return BranchInventory.objects.filter(branch=branch).select_related(
        "product__category"
    )


def get_product_availability(product: Product):
    return BranchInventory.objects.filter(product=product).select_related("branch")


def add_inventory(
    branch: Branch, product: Product, quantity: int, actor=None
) -> BranchInventory:
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")
    with transaction.atomic():
        inv = get_inventory_or_create(branch, product)
        inv.quantity += quantity
        inv.save(update_fields=["quantity", "updated_at"])
    return inv


def reduce_inventory(
    branch: Branch, product: Product, quantity: int, actor=None
) -> BranchInventory:
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")
    with transaction.atomic():
        try:
            inv = BranchInventory.objects.get(branch=branch, product=product)
        except BranchInventory.DoesNotExist:
            raise ValidationError("No inventory record found for this branch and product.")
        if inv.quantity < quantity:
            raise ValidationError(
                f"Insufficient stock. Available: {inv.quantity}, requested: {quantity}."
            )
        inv.quantity -= quantity
        inv.save(update_fields=["quantity", "updated_at"])
    return inv


def correct_inventory(
    branch: Branch, product: Product, new_quantity: int, actor=None
) -> BranchInventory:
    if new_quantity < 0:
        raise ValidationError("Quantity cannot be negative.")
    with transaction.atomic():
        inv = get_inventory_or_create(branch, product)
        inv.quantity = new_quantity
        inv.save(update_fields=["quantity", "updated_at"])
    return inv


def transfer_inventory(
    from_branch: Branch,
    to_branch: Branch,
    product: Product,
    quantity: int,
    actor=None,
) -> dict:
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")
    if from_branch == to_branch:
        raise ValidationError("Source and destination branches must be different.")
    with transaction.atomic():
        source = reduce_inventory(from_branch, product, quantity, actor=actor)
        dest = add_inventory(to_branch, product, quantity, actor=actor)
    return {"source": source, "destination": dest}


def validate_stock(branch: Branch, product: Product, quantity: int) -> bool:
    try:
        inv = BranchInventory.objects.get(branch=branch, product=product)
    except BranchInventory.DoesNotExist:
        return False
    return inv.quantity >= quantity
