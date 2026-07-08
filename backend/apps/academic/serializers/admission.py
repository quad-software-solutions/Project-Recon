from rest_framework import serializers


class AdmitStudentSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_null=True, allow_blank=True)
    branch = serializers.UUIDField()
    date_joined = serializers.DateField(required=False)
    guardian_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    guardian_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    guardian_email = serializers.EmailField(required=False, allow_blank=True, default="")
