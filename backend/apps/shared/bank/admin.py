from django.contrib import admin

from apps.accounts.permissions.roles import user_is_super_admin
from apps.shared.bank.models import BankAccount


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = (
        "bank_name", "account_holder", "account_number",
        "branch", "is_active", "created_at",
    )
    list_filter = ("bank_name", "is_active")
    search_fields = ("bank_name", "account_holder", "account_number")
    ordering = ("bank_name", "account_holder")

    def has_add_permission(self, request):
        return user_is_super_admin(request.user)

    def has_change_permission(self, request, obj=None):
        return user_is_super_admin(request.user)

    def has_delete_permission(self, request, obj=None):
        return user_is_super_admin(request.user)
