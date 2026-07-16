from rest_framework import serializers

from apps.shared.bank.models import BankAccount


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            "id", "bank_name", "account_holder", "account_number",
            "branch", "swift_code", "iban", "is_active", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
