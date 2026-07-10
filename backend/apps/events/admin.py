from django.contrib import admin

from apps.events.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "status", "visibility", "is_active", "start_datetime", "created_at")
    list_filter = ("status", "visibility", "event_type", "is_active")
    search_fields = ("title", "description", "location")
    readonly_fields = ("id", "enrolled_count", "created_at", "updated_at")
    ordering = ("-created_at",)
