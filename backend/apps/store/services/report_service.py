from datetime import timedelta

from django.db.models import Avg, Count, DecimalField, F, Max, Min, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from apps.store.models import Order, Product, ProductCategory
from apps.store.models.order import OrderStatus
from apps.store.models.branch_inventory import BranchInventory


def product_statistics():
    categories = ProductCategory.objects.annotate(
        total_products=Count("products"),
        active_products=Count("products", filter=Q(products__is_active=True, products__archived_at__isnull=True)),
        archived_products=Count("products", filter=Q(products__archived_at__isnull=False)),
    ).values(
        "id", "name", "is_active", "total_products", "active_products", "archived_products"
    ).order_by("name")

    total = Product.objects.count()
    active = Product.objects.filter(is_active=True, archived_at__isnull=True).count()
    archived = Product.objects.filter(archived_at__isnull=False).count()

    price_stats = Product.objects.aggregate(
        min_price=Min("price"),
        max_price=Max("price"),
        avg_price=Avg("price"),
    )

    return {
        "summary": {
            "total_products": total,
            "active_products": active,
            "archived_products": archived,
        },
        "price_stats": {
            "min": float(price_stats["min_price"] or 0),
            "max": float(price_stats["max_price"] or 0),
            "avg": round(float(price_stats["avg_price"] or 0), 2),
        },
        "by_category": list(categories),
    }


def inventory_report(branch_id=None):
    qs = BranchInventory.objects.select_related("branch", "product__category")
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    qs = qs.order_by("branch__name", "product__name")

    return [
        {
            "branch_id": str(rec.branch_id),
            "branch_name": rec.branch.name,
            "product_id": str(rec.product_id),
            "product_name": rec.product.name,
            "sku": rec.product.sku,
            "category": rec.product.category.name,
            "quantity": rec.quantity,
            "minimum_quantity": rec.minimum_quantity or 0,
        }
        for rec in qs
    ]


def low_stock_report():
    qs = BranchInventory.objects.select_related("branch", "product").filter(
        Q(quantity__lt=F("minimum_quantity"), minimum_quantity__isnull=False)
        | Q(quantity=0)
    ).order_by("quantity")

    return [
        {
            "branch_id": str(rec.branch_id),
            "branch_name": rec.branch.name,
            "product_id": str(rec.product_id),
            "product_name": rec.product.name,
            "sku": rec.product.sku,
            "quantity": rec.quantity,
            "minimum_quantity": rec.minimum_quantity or 0,
        }
        for rec in qs
    ]


def _get_group_trunc(group_by):
    if group_by == "week":
        return TruncWeek
    elif group_by == "month":
        return TruncMonth
    return TruncDate


def _default_date_range():
    end = timezone.now()
    start = end - timedelta(days=30)
    return start, end


def sales_report(start_date=None, end_date=None, branch_id=None, group_by="day"):
    if start_date is None or end_date is None:
        dstart, dend = _default_date_range()
        start_date = start_date or dstart
        end_date = end_date or dend

    trunc = _get_group_trunc(group_by)
    qs = Order.objects.filter(
        paid_at__gte=start_date,
        paid_at__lte=end_date,
    ).exclude(
        status__in=[OrderStatus.CANCELLED, OrderStatus.REFUNDED]
    )

    if branch_id:
        qs = qs.filter(branch_id=branch_id)

    qs = qs.annotate(period=trunc("paid_at")).values("period").annotate(
        order_count=Count("id"),
        total_revenue=Sum("total", output_field=DecimalField()),
        avg_order_value=Avg("total", output_field=DecimalField()),
    ).order_by("period")

    return [
        {
            "period": entry["period"].isoformat() if entry["period"] else None,
            "order_count": entry["order_count"],
            "total_revenue": float(entry["total_revenue"] or 0),
            "avg_order_value": round(float(entry["avg_order_value"] or 0), 2),
        }
        for entry in qs
    ]


def order_report(status=None, branch_id=None, start_date=None, end_date=None, group_by="day"):
    if start_date is None or end_date is None:
        dstart, dend = _default_date_range()
        start_date = start_date or dstart
        end_date = end_date or dend

    trunc = _get_group_trunc(group_by)
    qs = Order.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date,
    )

    if status:
        qs = qs.filter(status=status)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)

    qs = qs.annotate(period=trunc("created_at")).values("period").annotate(
        order_count=Count("id"),
        total_value=Sum("total", output_field=DecimalField()),
    ).order_by("period")

    return [
        {
            "period": entry["period"].isoformat() if entry["period"] else None,
            "order_count": entry["order_count"],
            "total_value": float(entry["total_value"] or 0),
        }
        for entry in qs
    ]


def branch_sales_report(branch_id=None, group_by="month"):
    start, end = _default_date_range()

    trunc = _get_group_trunc(group_by)
    qs = Order.objects.filter(
        paid_at__gte=start,
        paid_at__lte=end,
    ).exclude(
        status__in=[OrderStatus.CANCELLED, OrderStatus.REFUNDED]
    )

    if branch_id:
        qs = qs.filter(branch_id=branch_id)

    qs = qs.annotate(
        period=trunc("paid_at"),
        branch_name=F("branch__name"),
    ).values("period", "branch_id", "branch_name").annotate(
        order_count=Count("id"),
        total_revenue=Sum("total", output_field=DecimalField()),
    ).order_by("period", "branch_name")

    return [
        {
            "period": entry["period"].isoformat() if entry["period"] else None,
            "branch_id": str(entry["branch_id"]),
            "branch_name": entry["branch_name"],
            "order_count": entry["order_count"],
            "total_revenue": float(entry["total_revenue"] or 0),
        }
        for entry in qs
    ]
