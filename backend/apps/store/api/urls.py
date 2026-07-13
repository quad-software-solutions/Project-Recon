from django.urls import path

from apps.store.api.views import (
    AdminCategoryActivateView,
    AdminCategoryDeactivateView,
    AdminCategoryListCreateView,
    AdminCategoryRetrieveUpdateView,
    AdminProductActivateView,
    AdminProductArchiveView,
    AdminProductDeactivateView,
    AdminProductImageListView,
    AdminProductImageRetrieveDestroyView,
    AdminProductImageReorderView,
    AdminProductImageSetPrimaryView,
    AdminProductImageUploadView,
    AdminProductListCreateView,
    AdminProductRestoreView,
    AdminProductRetrieveUpdateView,
    PublicCategoryDetailView,
    PublicCategoryListView,
    PublicProductDetailView,
    PublicProductListView,
)

urlpatterns = [
    # Public
    path("categories/", PublicCategoryListView.as_view(), name="store-category-list"),
    path(
        "categories/<uuid:pk>/",
        PublicCategoryDetailView.as_view(),
        name="store-category-detail",
    ),
    path("products/", PublicProductListView.as_view(), name="store-product-list"),
    path(
        "products/<uuid:pk>/",
        PublicProductDetailView.as_view(),
        name="store-product-detail",
    ),
    # Admin - Categories
    path(
        "admin/categories/",
        AdminCategoryListCreateView.as_view(),
        name="store-admin-category-list",
    ),
    path(
        "admin/categories/<uuid:pk>/",
        AdminCategoryRetrieveUpdateView.as_view(),
        name="store-admin-category-detail",
    ),
    path(
        "admin/categories/<uuid:pk>/activate/",
        AdminCategoryActivateView.as_view(),
        name="store-admin-category-activate",
    ),
    path(
        "admin/categories/<uuid:pk>/deactivate/",
        AdminCategoryDeactivateView.as_view(),
        name="store-admin-category-deactivate",
    ),
    # Admin - Products
    path(
        "admin/products/",
        AdminProductListCreateView.as_view(),
        name="store-admin-product-list",
    ),
    path(
        "admin/products/<uuid:pk>/",
        AdminProductRetrieveUpdateView.as_view(),
        name="store-admin-product-detail",
    ),
    path(
        "admin/products/<uuid:pk>/archive/",
        AdminProductArchiveView.as_view(),
        name="store-admin-product-archive",
    ),
    path(
        "admin/products/<uuid:pk>/restore/",
        AdminProductRestoreView.as_view(),
        name="store-admin-product-restore",
    ),
    path(
        "admin/products/<uuid:pk>/activate/",
        AdminProductActivateView.as_view(),
        name="store-admin-product-activate",
    ),
    path(
        "admin/products/<uuid:pk>/deactivate/",
        AdminProductDeactivateView.as_view(),
        name="store-admin-product-deactivate",
    ),
    # Admin - Product Images
    path(
        "admin/products/<uuid:product_pk>/images/",
        AdminProductImageUploadView.as_view(),
        name="store-admin-product-image-upload",
    ),
    path(
        "admin/products/<uuid:product_pk>/images/list/",
        AdminProductImageListView.as_view(),
        name="store-admin-product-image-list",
    ),
    path(
        "admin/products/<uuid:product_pk>/images/reorder/",
        AdminProductImageReorderView.as_view(),
        name="store-admin-product-image-reorder",
    ),
    path(
        "admin/product-images/<uuid:pk>/",
        AdminProductImageRetrieveDestroyView.as_view(),
        name="store-admin-product-image-detail",
    ),
    path(
        "admin/product-images/<uuid:pk>/set-primary/",
        AdminProductImageSetPrimaryView.as_view(),
        name="store-admin-product-image-set-primary",
    ),
]
