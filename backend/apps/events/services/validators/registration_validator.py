from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.events.constants import PaymentMethod, RegistrationMode, RegistrationStatus
from apps.events.models import Event


class RegistrationValidator:
    """
    Reusable business validation for Event Registration operations.
    """

    @staticmethod
    def validate_registration_enabled(event):
        """
        Ensure the event has registration enabled.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If registration is not enabled.
        """
        if not event.registration_enabled:
            raise ValidationError("Registration is not enabled for this event.")

    @staticmethod
    def validate_registration_deadline(event):
        """
        Ensure the current time is before the registration deadline.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If deadline has passed.
        """
        if event.registration_deadline and timezone.now() > event.registration_deadline:
            raise ValidationError("Registration deadline has passed.")

    @staticmethod
    def validate_capacity(event):
        """
        Ensure the event has capacity for new registrations.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If capacity is reached.
        """
        if event.capacity is not None and event.enrolled_count >= event.capacity:
            raise ValidationError("Event registration is full.")

    @staticmethod
    def validate_public_registration(event):
        """
        Ensure the event registration mode allows public registration.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If mode is not PUBLIC.
        """
        if event.registration_mode != RegistrationMode.PUBLIC:
            raise ValidationError("Public registration is not allowed for this event.")

    @staticmethod
    def validate_student_registration(event):
        """
        Ensure the event registration mode allows student registration.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If mode does not allow student registration.
        """
        if event.registration_mode not in (RegistrationMode.STUDENT, RegistrationMode.SUBPROGRAM_STUDENT):
            raise ValidationError("Student registration is not allowed for this event.")

    @staticmethod
    def validate_duplicate(event, student=None, public_email=None, exclude_id=None):
        """
        Ensure no duplicate active registration exists for the same participant.

        Args:
            event: Event instance.
            student: Optional Student instance.
            public_email: Optional public email string.
            exclude_id: Optional registration UUID to exclude (for idempotency).

        Raises:
            ValidationError: If an active registration already exists.
        """
        from apps.events.models import EventRegistration

        active_statuses = [RegistrationStatus.PENDING, RegistrationStatus.APPROVED]

        if student:
            qs = EventRegistration.objects.filter(
                event=event,
                student=student,
                registration_status__in=active_statuses,
            )
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if qs.exists():
                raise ValidationError("You are already registered for this event.")

        if public_email:
            qs = EventRegistration.objects.filter(
                event=event,
                public_email=public_email,
                registration_status__in=active_statuses,
            )
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if qs.exists():
                raise ValidationError("A registration with this email already exists for this event.")

    @staticmethod
    def validate_payment_evidence(event, payment_data):
        """
        Ensure payment evidence is provided when payment is required.

        Args:
            event: Event instance.
            payment_data: Optional dict with payment evidence fields.

        Raises:
            ValidationError: If payment is required but evidence is missing
                             or invalid.
        """
        if not event.payment_required:
            return

        if not payment_data:
            raise ValidationError(
                "Payment is required for this event. "
                "Please provide payment evidence."
            )

        payment_method = payment_data.get("payment_method")
        if payment_method and payment_method != PaymentMethod.CASH:
            transaction_reference = payment_data.get("transaction_reference")
            attachment = payment_data.get("attachment")
            if not transaction_reference and not attachment:
                raise ValidationError(
                    "At least a transaction reference or payment attachment "
                    "is required for non-cash payments."
                )

    @staticmethod
    def validate_event_visibility(event):
        """
        Ensure the event is published and active.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If event is not available for registration.
        """
        from apps.events.constants import EventStatus

        if event.status != EventStatus.PUBLISHED:
            raise ValidationError("Cannot register for an event that is not published.")
        if not event.is_active:
            raise ValidationError("Cannot register for an inactive event.")
