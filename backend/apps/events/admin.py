from django.contrib import admin

from apps.events.models import Event, Tournament, TournamentCategory, TournamentTeam


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "status", "visibility", "is_active", "start_datetime", "created_at")
    list_filter = ("status", "visibility", "event_type", "is_active")
    search_fields = ("title", "description", "location")
    readonly_fields = ("id", "enrolled_count", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ("event", "category", "is_closed", "max_teams", "created_at")
    list_filter = ("category", "is_closed")
    search_fields = ("event__title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TournamentCategory)
class TournamentCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TournamentTeam)
class TournamentTeamAdmin(admin.ModelAdmin):
    list_display = ("team_name", "tournament", "wins", "losses", "points", "created_at")
    list_filter = ("tournament",)
    search_fields = ("team_name", "organization")
    readonly_fields = ("id", "wins", "losses", "draws", "points", "created_at", "updated_at")
