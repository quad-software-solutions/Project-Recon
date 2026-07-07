from django.contrib import admin

from apps.academic.models import Program, SubProgram, Class


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "supports_group", "supports_individual", "is_active", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["is_active", "supports_group", "supports_individual"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(SubProgram)
class SubProgramAdmin(admin.ModelAdmin):
    list_display = ["name", "program", "fee", "is_active", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["is_active", "program", "duration_unit"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ["name", "sub_program", "branch", "instructor", "class_type", "is_active"]
    search_fields = ["name"]
    list_filter = ["is_active", "class_type", "branch"]
