from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.academic.models import Program


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "supports_group",
            "supports_individual",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProgramListSerializer(serializers.ModelSerializer):
    sub_programs_count = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "supports_group",
            "supports_individual",
            "is_active",
            "sub_programs_count",
            "created_at",
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_sub_programs_count(self, obj):
        return obj.sub_programs.count()
