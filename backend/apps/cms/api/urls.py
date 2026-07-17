from django.urls import path

from apps.cms.api.views import (
    PublicHeroBannerListView,
    AdminHeroBannerListCreateView,
    AdminHeroBannerRetrieveUpdateDestroyView,
    PublicNewsArticleListView,
    PublicNewsArticleDetailView,
    AdminNewsArticleListCreateView,
    AdminNewsArticleRetrieveUpdateDestroyView,
    PublicPartnerListView,
    AdminPartnerListCreateView,
    AdminPartnerRetrieveUpdateDestroyView,
    PublicAboutUsListView,
    PublicAboutUsDetailView,
    AdminAboutUsListCreateView,
    AdminAboutUsRetrieveUpdateDestroyView,
    PublicCreateContactRequestView,
    AdminContactRequestListCreateView,
    AdminContactRequestRetrieveUpdateDestroyView,
    PublicFAQListView,
    AdminFAQListCreateView,
    AdminFAQRetrieveUpdateDestroyView,
    PublicMapNodeListView,
    AdminMapNodeListCreateView,
    AdminMapNodeRetrieveUpdateDestroyView,
    PublicGalleryListView,
    PublicGalleryDetailView,
    AdminGalleryListCreateView,
    AdminGalleryRetrieveUpdateDestroyView,
    PublicPlatformStatsView,
)

urlpatterns = [
    # Public
    path("hero-banners/", PublicHeroBannerListView.as_view(), name="cms-hero-banner-list"),
    path("news/", PublicNewsArticleListView.as_view(), name="cms-news-list"),
    path("news/<slug:slug>/", PublicNewsArticleDetailView.as_view(), name="cms-news-detail"),
    path("partners/", PublicPartnerListView.as_view(), name="cms-partner-list"),
    path("about/", PublicAboutUsListView.as_view(), name="cms-about-list"),
    path("about/<slug:slug>/", PublicAboutUsDetailView.as_view(), name="cms-about-detail"),
    path("faqs/", PublicFAQListView.as_view(), name="cms-faq-list"),
    path("contact-requests/", PublicCreateContactRequestView.as_view(), name="cms-contact-request-create"),
    path("stats/", PublicPlatformStatsView.as_view(), name="cms-stats"),
    # Admin
    path("admin/hero-banners/", AdminHeroBannerListCreateView.as_view(), name="cms-admin-hero-banner-list"),
    path(
        "admin/hero-banners/<uuid:pk>/",
        AdminHeroBannerRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-hero-banner-detail",
    ),
    path("admin/news/", AdminNewsArticleListCreateView.as_view(), name="cms-admin-news-list"),
    path(
        "admin/news/<uuid:pk>/",
        AdminNewsArticleRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-news-detail",
    ),
    path("admin/partners/", AdminPartnerListCreateView.as_view(), name="cms-admin-partner-list"),
    path(
        "admin/partners/<uuid:pk>/",
        AdminPartnerRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-partner-detail",
    ),
    path("admin/about/", AdminAboutUsListCreateView.as_view(), name="cms-admin-about-list"),
    path(
        "admin/about/<uuid:pk>/",
        AdminAboutUsRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-about-detail",
    ),
    path("admin/faqs/", AdminFAQListCreateView.as_view(), name="cms-admin-faq-list"),
    path(
        "admin/faqs/<uuid:pk>/",
        AdminFAQRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-faq-detail",
    ),
    path(
        "admin/contact-requests/",
        AdminContactRequestListCreateView.as_view(),
        name="cms-admin-contact-request-list",
    ),
    path(
        "admin/contact-requests/<uuid:pk>/",
        AdminContactRequestRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-contact-request-detail",
    ),
    # Map Nodes
    path("map-nodes/", PublicMapNodeListView.as_view(), name="cms-map-node-list"),
    path(
        "admin/map-nodes/",
        AdminMapNodeListCreateView.as_view(),
        name="cms-admin-map-node-list",
    ),
    path(
        "admin/map-nodes/<uuid:pk>/",
        AdminMapNodeRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-map-node-detail",
    ),
    # Gallery
    path("gallery/", PublicGalleryListView.as_view(), name="cms-gallery-list"),
    path("gallery/<uuid:pk>/", PublicGalleryDetailView.as_view(), name="cms-gallery-detail"),
    path(
        "admin/gallery/",
        AdminGalleryListCreateView.as_view(),
        name="cms-admin-gallery-list",
    ),
    path(
        "admin/gallery/<uuid:pk>/",
        AdminGalleryRetrieveUpdateDestroyView.as_view(),
        name="cms-admin-gallery-detail",
    ),
]
