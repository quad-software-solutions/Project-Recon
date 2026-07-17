from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.events.constants import EventType, RegistrationMode


class EventValidator:
    """
    Reusable business validation for Event operations.

    These validators never save data. They raise ValidationError when
    business rules are violated.
    """

    @staticmethod
    def validate_dates(start_datetime, end_datetime):
        """
        Ensure start is before end and both are in the future for new events.

        Args:
            start_datetime: Event start datetime.
            end_datetime: Event end datetime.

        Raises:
            ValidationError: If start is not before end.
        """
        if start_datetime and end_datetime and start_datetime >= end_datetime:
            raise ValidationError(
                "Start date and time must be before end date and time."
            )

    @staticmethod
    def validate_registration_config(
        registration_enabled,
        registration_mode=None,
        registration_deadline=None,
        payment_required=False,
        registration_fee=None,
    ):
        """
        Validate registration configuration consistency.

        Args:
            registration_enabled: Whether registration is enabled.
            registration_mode: Required when registration is enabled.
            registration_deadline: Optional deadline.
            payment_required: Whether payment is required.
            registration_fee: Required when payment is enabled.

        Raises:
            ValidationError: On invalid configuration.
        """
        if registration_enabled:
            if not registration_mode:
                raise ValidationError(
                    "Registration mode is required when registration is enabled."
                )
            if registration_mode == RegistrationMode.NONE:
                raise ValidationError(
                    "Registration mode cannot be NONE when registration is enabled."
                )
            if registration_deadline and registration_deadline <= timezone.now():
                raise ValidationError(
                    "Registration deadline must be in the future."
                )
        else:
            if registration_mode:
                raise ValidationError(
                    "Registration mode must be empty when registration is disabled."
                )
            if payment_required:
                raise ValidationError(
                    "Payment cannot be required when registration is disabled."
                )

        if payment_required:
            if not registration_fee or registration_fee <= 0:
                raise ValidationError(
                    "Registration fee must be greater than zero when payment is required."
                )
        else:
            if registration_fee:
                raise ValidationError(
                    "Registration fee must be empty when payment is not required."
                )

    @staticmethod
    def validate_event_type(event_type):
        """
        Validate that event type is valid.

        Args:
            event_type: The event type string.

        Raises:
            ValidationError: If the event type is not supported.
        """
        valid_types = [choice[0] for choice in EventType.choices]
        if event_type not in valid_types:
            raise ValidationError(
                f"Invalid event type '{event_type}'. "
                f"Valid types: {', '.join(valid_types)}."
            )
