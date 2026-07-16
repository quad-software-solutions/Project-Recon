from django.contrib import admin

from apps.store.models import (
    BranchInventory,
    Order,
    OrderItem,
    OrderStatusHistory,
    PendingOrder,
    PendingOrderItem,
    Product,
    ProductCategory,
    ProductImage,
    ShoppingCart,
    ShoppingCartItem,
    StorePayment,
)


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "sku", "price", "is_active", "archived_at")
    search_fields = ("name", "sku")
    list_filter = ("category", "is_active", "archived_at")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "is_primary", "display_order", "created_at")
    list_filter = ("is_primary",)


@admin.register(BranchInventory)
class BranchInventoryAdmin(admin.ModelAdmin):
    list_display = ("product", "branch", "quantity", "minimum_quantity")
    search_fields = ("product__name", "branch__name")
    list_filter = ("branch",)


@admin.register(ShoppingCart)
class ShoppingCartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_key", "expires_at", "created_at")
    search_fields = ("user__email", "session_key")


@admin.register(ShoppingCartItem)
class ShoppingCartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "product", "branch", "quantity", "created_at")
    search_fields = ("product__name", "branch__name")


@admin.register(PendingOrder)
class PendingOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "branch", "total", "payment_reference", "expires_at", "created_at")
    search_fields = ("user__email", "payment_reference")
    list_filter = ("branch",)


@admin.register(PendingOrderItem)
class PendingOrderItemAdmin(admin.ModelAdmin):
    list_display = ("pending_order", "product", "quantity", "unit_price", "subtotal")


@admin.register(StorePayment)
class StorePaymentAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_reference",
        "pending_order",
        "amount",
        "payment_method",
        "status",
        "verified_by",
        "payment_date",
        "created_at",
    )
    search_fields = ("transaction_reference",)
    list_filter = ("status", "payment_method")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "branch", "status", "total", "paid_at", "completed_at", "created_at")
    search_fields = ("order_number", "payment_reference", "guest_name")
    list_filter = ("status", "branch")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "product_name", "quantity", "unit_price", "subtotal")
    search_fields = ("product_name",)


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("order", "previous_status", "new_status", "changed_by", "changed_at")
    list_filter = ("new_status",)
