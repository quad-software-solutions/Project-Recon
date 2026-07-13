from django.contrib import admin

from apps.store.models import BranchInventory, Product, ProductCategory, ProductImage


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
