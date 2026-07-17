from django.utils import timezone

from apps.events.constants import EventStatus, Visibility
from apps.events.models import Event


class UpcomingEventsQuery:
    """
    Returns published, public events that start in the future.
    """

    @staticmethod
    def execute():
        """
        Return queryset of upcoming events.

        Returns:
            QuerySet of Event objects with start_datetime in the future.
        """
        now = timezone.now()
        return Event.objects.filter(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            is_active=True,
            start_datetime__gt=now,
        ).order_by("start_datetime")
