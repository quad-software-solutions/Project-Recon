from rest_framework.exceptions import ValidationError

from apps.events.constants import EventType


class TournamentValidator:
    """
    Reusable business validation for Tournament operations.
    """

    @staticmethod
    def validate_event_type(event):
        """
        Ensure the event has event_type TOURNAMENT.

        Args:
            event: Event instance.

        Raises:
            ValidationError: If event_type is not TOURNAMENT.
        """
        if event.event_type != EventType.TOURNAMENT:
            raise ValidationError(
                f"Cannot create tournament for event type '{event.event_type}'. "
                "Event must have event_type TOURNAMENT."
            )

    @staticmethod
    def validate_max_teams(max_teams):
        """
        Validate max_teams value.

        Args:
            max_teams: Optional positive integer.

        Raises:
            ValidationError: If max_teams is provided but invalid.
        """
        if max_teams is not None and max_teams < 1:
            raise ValidationError("Maximum teams must be at least 1.")

    @staticmethod
    def validate_prize_pool(prize_pool):
        """
        Validate prize_pool value.

        Args:
            prize_pool: Optional decimal.

        Raises:
            ValidationError: If prize_pool is negative.
        """
        if prize_pool is not None and prize_pool < 0:
            raise ValidationError("Prize pool cannot be negative.")
