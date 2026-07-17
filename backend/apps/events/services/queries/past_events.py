from django.utils import timezone

from apps.events.constants import EventStatus, Visibility
from apps.events.models import Event


class PastEventsQuery:
    """
    Returns published, public events that have ended.
    """

    @staticmethod
    def execute():
        """
        Return queryset of past events.

        Past events are those where end_datetime is before now.

        Returns:
            QuerySet of Event objects that have ended.
        """
        now = timezone.now()
        return Event.objects.filter(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            is_active=True,
            end_datetime__lt=now,
        ).order_by("-end_datetime")
