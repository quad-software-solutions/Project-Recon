from django.contrib import admin

from apps.events.models import (
    Event,
    EventPayment,
    EventRegistration,
    Match,
    MatchParticipant,
    MatchSide,
    Tournament,
    TournamentCategory,
    TournamentTeam,
    Workshop,
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


@admin.register(Workshop)
class WorkshopAdmin(admin.ModelAdmin):
    list_display = ("event", "instructor", "level", "duration_minutes", "price", "created_at")
    list_filter = ("level",)
    search_fields = ("event__title", "instructor__email")
    readonly_fields = ("id", "created_at", "updated_at")


class EventPaymentInline(admin.StackedInline):
    model = EventPayment
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at", "verified_by", "verified_at")


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ("event", "student", "public_email", "registration_status", "payment_status", "registered_at")
    list_filter = ("registration_status", "payment_status")
    search_fields = ("event__title", "public_email", "student__user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [EventPaymentInline]


@admin.register(EventPayment)
class EventPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "registration", "amount", "payment_method", "status",
        "verified_by", "verified_at", "payment_date", "created_at",
    )
    list_filter = ("status", "payment_method")
    search_fields = ("transaction_reference", "registration__event__title")
    readonly_fields = (
        "id", "verified_by", "verified_at", "created_at", "updated_at",
    )
