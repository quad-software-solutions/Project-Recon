from rest_framework import serializers

from apps.academic.models import BranchTransferRequest


class BranchTransferRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchTransferRequest
        fields = "__all__"
        read_only_fields = [
            "id", "requested_by", "approved_by", "created_at",
            "approved_at", "status",
        ]


class BranchTransferRequestCreateSerializer(serializers.Serializer):
    enrollment = serializers.UUIDField()
    target_class = serializers.UUIDField()
    to_branch = serializers.UUIDField()


class BranchTransferApproveSerializer(serializers.Serializer):
    pass


class BranchTransferRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(max_length=500)


class SwitchSubProgramSerializer(serializers.Serializer):
    target_class = serializers.UUIDField()
