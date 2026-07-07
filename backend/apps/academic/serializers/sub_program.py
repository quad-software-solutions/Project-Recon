from rest_framework import serializers

from apps.academic.models import SubProgram


class SubProgramSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)

    class Meta:
        model = SubProgram
        fields = [
            "id",
            "program",
            "program_name",
            "name",
            "slug",
            "description",
            "duration",
            "duration_unit",
            "fee",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "program_name"]


class SubProgramListSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)

    class Meta:
        model = SubProgram
        fields = [
            "id",
            "program",
            "program_name",
            "name",
            "slug",
            "fee",
            "is_active",
            "created_at",
        ]
