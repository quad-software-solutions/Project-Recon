from django.contrib import admin

from apps.cms.models import (
    HeroBanner,
    NewsArticle,
    Partner,
    AboutUs,
    ContactRequest,
    FAQ,
    MapNode,
    Gallery,
    Testimonial,
    HomepageStatistic,
)


@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    search_fields = ("title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "is_active", "published_at", "created_at")
    search_fields = ("title", "slug")
    readonly_fields = ("id", "created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "is_active", "created_at")
    search_fields = ("title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(AboutUs)
class AboutUsAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    search_fields = ("title", "slug")
    readonly_fields = ("id", "created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    list_display = ("ticket_number", "name", "email", "subject", "status", "priority", "created_at")
    search_fields = ("ticket_number", "name", "email", "subject")
    list_filter = ("status", "priority")
    readonly_fields = ("id", "ticket_number", "created_at", "updated_at")


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "is_active", "created_at")
    search_fields = ("question",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(MapNode)
class MapNodeAdmin(admin.ModelAdmin):
    list_display = ("title", "city", "country", "category", "is_active", "created_at")
    search_fields = ("title", "city", "country")
    list_filter = ("category", "is_active")
    readonly_fields = ("id", "created_at", "updated_at")

@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    search_fields = ("title",)
    list_filter = ("is_active",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "order", "is_active", "created_at")
    search_fields = ("name", "role", "quote")
    list_filter = ("is_active", "role")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(HomepageStatistic)
class HomepageStatisticAdmin(admin.ModelAdmin):
    list_display = ("future_engineers", "programs", "competitions", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")
