from django.contrib import admin

from apps.academic.models import (
    Program, SubProgram, Class, Student, EnrollmentPeriod,
    StaffAttendanceSession, StaffAttendanceRecord,
)
from apps.accounts.permissions.roles import user_is_super_admin


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "supports_group", "supports_individual", "is_active", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["is_active", "supports_group", "supports_individual"]
    prepopulated_fields = {"slug": ["name"]}

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(SubProgram)
class SubProgramAdmin(admin.ModelAdmin):
    list_display = ["name", "program", "group_fee", "individual_fee", "is_active", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["is_active", "program", "duration_unit"]
    prepopulated_fields = {"slug": ["name"]}

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ["name", "sub_program", "branch", "instructor", "class_type", "is_active"]
    search_fields = ["name"]
    list_filter = ["is_active", "class_type", "branch"]

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["user", "branch", "date_joined", "is_active", "created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    list_filter = ["is_active", "branch"]

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(EnrollmentPeriod)
class EnrollmentPeriodAdmin(admin.ModelAdmin):
    list_display = ["title", "branch", "program", "sub_program", "class_type", "class_period", "start_date", "end_date", "is_active"]
    search_fields = ["title"]
    list_filter = ["is_active", "class_type", "branch"]

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(StaffAttendanceSession)
class StaffAttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ["branch", "date", "status", "created_by", "is_active", "created_at"]
    search_fields = ["branch__name", "notes"]
    list_filter = ["status", "is_active", "branch"]

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)


@admin.register(StaffAttendanceRecord)
class StaffAttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ["staff_member", "session", "status", "created_at"]
    search_fields = ["staff_member__email", "staff_member__first_name"]
    list_filter = ["status"]

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_view_permission(self, request, obj=None):
        return user_is_super_admin(request.user)
