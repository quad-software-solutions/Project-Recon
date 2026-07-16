from rest_framework import serializers

from apps.events.models import EventPayment, EventRegistration, Tournament
from apps.events.api.serializers.payment import PaymentEvidenceSerializer


class PublicRegistrationSerializer(serializers.Serializer):
    public_full_name = serializers.CharField(max_length=255)
    public_email = serializers.EmailField()
    public_phone = serializers.CharField(max_length=50)
    public_organization = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    payment = PaymentEvidenceSerializer(required=False, allow_null=True)


class StudentRegistrationSerializer(serializers.Serializer):
    student = serializers.UUIDField(required=False)
    payment = PaymentEvidenceSerializer(required=False, allow_null=True)


class RegistrationAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True, default=None)
    student_name = serializers.SerializerMethodField()
    tournament = serializers.SerializerMethodField()
    payment_info = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "event",
            "event_title",
            "student",
            "student_email",
            "student_name",
            "public_full_name",
            "public_email",
            "public_phone",
            "public_organization",
            "registration_status",
            "payment_status",
            "payment_info",
            "registered_at",
            "approved_at",
            "cancelled_at",
            "tournament",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "registered_at", "approved_at", "cancelled_at",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        if obj.student:
            user = obj.student.user
            name = f"{user.first_name} {user.last_name}".strip()
            return name or user.email
        return None

    def get_tournament(self, obj):
        try:
            return str(obj.event.tournament.id)
        except Tournament.DoesNotExist:
            return None

    def get_payment_info(self, obj):
        try:
            payment = obj.payment
            from apps.events.api.serializers.payment import EventPaymentSerializer
            return EventPaymentSerializer(payment).data
        except EventPayment.DoesNotExist:
            return None


class MyRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start = serializers.DateTimeField(source="event.start_datetime", read_only=True)
    event_end = serializers.DateTimeField(source="event.end_datetime", read_only=True)
    event_location = serializers.CharField(source="event.location", read_only=True)
    event_type = serializers.CharField(source="event.event_type", read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "event",
            "event_title",
            "event_start",
            "event_end",
            "event_location",
            "event_type",
            "registration_status",
            "payment_status",
            "registered_at",
        ]
        read_only_fields = fields
