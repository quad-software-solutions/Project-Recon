from rest_framework import serializers


class ReportQuerySerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=False, allow_null=True)
    date_from = serializers.DateField(required=False, allow_null=True)
    date_to = serializers.DateField(required=False, allow_null=True)
