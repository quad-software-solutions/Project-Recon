from rest_framework import serializers

from apps.academic.models import SubProgram


class SubProgramSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)

    def validate_group_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("Fee cannot be negative.")
        return value

    def validate_individual_fee(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Fee cannot be negative.")
        return value

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
            "group_fee",
            "individual_fee",
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
            "group_fee",
            "individual_fee",
            "is_active",
            "created_at",
        ]
