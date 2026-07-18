from rest_framework import serializers

from apps.cms.models import ContactRequest
from apps.shared.validators import validate_uploaded_file


class ContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = (
            "id",
            "ticket_number",
            "name",
            "email",
            "phone",
            "subject",
            "description",
            "attachment",
            "status",
            "priority",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "ticket_number",
            "created_at",
            "updated_at",
        )

    def validate_attachment(self, value):
        if value:
            validate_uploaded_file(value)
        return value


class ContactRequestAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = (
            "id",
            "ticket_number",
            "name",
            "email",
            "phone",
            "subject",
            "description",
            "attachment",
            "status",
            "priority",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "ticket_number", "created_at", "updated_at")

    def validate_attachment(self, value):
        if value:
            validate_uploaded_file(value)
        return value


class ContactRequestResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = (
            "id",
            "ticket_number",
            "name",
            "email",
            "phone",
            "subject",
            "description",
            "attachment",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ContactRequestCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    subject = serializers.CharField(max_length=300)
    description = serializers.CharField()
    attachment = serializers.FileField(required=False, allow_null=True)

    def validate_attachment(self, value):
        if value:
            validate_uploaded_file(value)
        return value
