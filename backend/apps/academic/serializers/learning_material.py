from rest_framework import serializers

from apps.academic.models import LearningMaterial
from apps.shared.validators import validate_uploaded_file


class LearningMaterialSerializer(serializers.ModelSerializer):
    sub_program = serializers.UUIDField(required=True)
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    uploaded_by_name = serializers.SerializerMethodField(read_only=True)
    file_url = serializers.SerializerMethodField(read_only=True)
    material_type = serializers.CharField(read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "title",
            "description",
            "file",
            "file_url",
            "material_type",
            "uploaded_by",
            "uploaded_by_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "is_active", "created_at", "updated_at",
            "sub_program_name", "uploaded_by_name", "file_url",
            "material_type",
        ]
        extra_kwargs = {
            "file": {"write_only": True},
            "uploaded_by": {"read_only": True},
        }

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def validate_file(self, value):
        import os
        if os.path.basename(value.name) != value.name:
            from django.core.exceptions import ValidationError
            raise ValidationError("Filename must not contain directory separators.")
        validate_uploaded_file(value)
        return value


class LearningMaterialListSerializer(serializers.ModelSerializer):
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    uploaded_by_name = serializers.SerializerMethodField(read_only=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "title",
            "description",
            "file_url",
            "material_type",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "sub_program_name", "uploaded_by_name", "file_url"]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
