from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.shared.bank.api.permissions import BankAccountPermission
from apps.shared.bank.api.serializers import BankAccountSerializer
from apps.shared.bank.models import BankAccount


@extend_schema_view(
    list=extend_schema(
        summary="List bank accounts",
        description="Anyone can list active bank accounts.",
        tags=["Bank Accounts"],
    ),
    retrieve=extend_schema(
        summary="Retrieve a bank account",
        description="Anyone can view a bank account's details.",
        tags=["Bank Accounts"],
    ),
    create=extend_schema(
        summary="Create a bank account",
        description="Super admin only.",
        tags=["Bank Accounts"],
    ),
    update=extend_schema(
        summary="Update a bank account",
        description="Super admin only.",
        tags=["Bank Accounts"],
    ),
    partial_update=extend_schema(
        summary="Partially update a bank account",
        description="Super admin only.",
        tags=["Bank Accounts"],
    ),
    destroy=extend_schema(
        summary="Delete a bank account",
        description="Super admin only.",
        tags=["Bank Accounts"],
    ),
)
class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [BankAccountPermission]
    lookup_field = "id"
