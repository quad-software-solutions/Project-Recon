from django.contrib import admin

from apps.events.models import (
    Event,
    Match,
    MatchParticipant,
    MatchSide,
    Tournament,
    TournamentCategory,
    TournamentTeam,
)


class MatchSideInline(admin.TabularInline):
    model = MatchSide
    extra = 0
    readonly_fields = ("id", "side", "score", "created_at", "updated_at")


class MatchParticipantInline(admin.TabularInline):
    model = MatchParticipant
    extra = 0
    readonly_fields = ("id", "created_at")


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


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ("tournament", "round", "status", "scheduled_at", "completed_at", "winning_side")
    list_filter = ("status", "round")
    search_fields = ("tournament__event__title",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [MatchSideInline]


@admin.register(MatchSide)
class MatchSideAdmin(admin.ModelAdmin):
    list_display = ("match", "side", "score", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [MatchParticipantInline]


@admin.register(MatchParticipant)
class MatchParticipantAdmin(admin.ModelAdmin):
    list_display = ("tournament_team", "match_side", "created_at")
    search_fields = ("tournament_team__team_name",)
    readonly_fields = ("id", "created_at")
