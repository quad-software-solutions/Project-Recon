from django.utils import timezone

from apps.events.constants import EventStatus, Visibility
from apps.events.models import Event


class LiveEventsQuery:
    """
    Returns published, public events currently happening.
    """

    @staticmethod
    def execute():
        """
        Return queryset of live events.

        Live events are those where current time is between start and end.

        Returns:
            QuerySet of Event objects currently active.
        """
        now = timezone.now()
        return Event.objects.filter(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            is_active=True,
            start_datetime__lte=now,
            end_datetime__gte=now,
        ).order_by("start_datetime")
