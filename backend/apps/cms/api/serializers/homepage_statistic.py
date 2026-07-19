from rest_framework import serializers

from apps.cms.models import HomepageStatistic


class HomepageStatisticSerializer(serializers.ModelSerializer):
    """Public serializer — returns nested mission object with computed percentage."""

    mission = serializers.SerializerMethodField()

    class Meta:
        model = HomepageStatistic
        fields = (
            "future_engineers",
            "programs",
            "competitions",
            "mission",
        )

    def get_mission(self, obj) -> dict:
        target = obj.mission_target
        current = obj.mission_current
        percentage = round((current / target) * 100, 2) if target else 0.0
        return {
            "current": current,
            "target": target,
            "percentage": percentage,
        }


class HomepageStatisticAdminSerializer(serializers.ModelSerializer):
    """Admin serializer — flat fields for read/write without computed fields."""

    class Meta:
        model = HomepageStatistic
        fields = (
            "id",
            "future_engineers",
            "programs",
            "competitions",
            "mission_current",
            "mission_target",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
