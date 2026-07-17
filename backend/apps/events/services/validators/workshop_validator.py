from rest_framework.exceptions import ValidationError

from apps.events.constants import EventType


class WorkshopValidator:
    """
    Reusable business validation for Workshop operations.
    """

    @staticmethod
    def validate_event_type(event):
        """
        Ensure the event has event_type WORKSHOP.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If event_type is not WORKSHOP.
        """
        if event.event_type != EventType.WORKSHOP:
            raise ValidationError(
                "Workshop can only be created for events with event_type 'WORKSHOP'."
            )

    @staticmethod
    def validate_duration(duration_minutes):
        """
        Ensure the workshop duration is positive.

        Args:
            duration_minutes: Integer duration in minutes.

        Raises:
            ValidationError: If duration is zero or negative.
        """
        if not duration_minutes or duration_minutes <= 0:
            raise ValidationError("Workshop duration must be a positive number.")
