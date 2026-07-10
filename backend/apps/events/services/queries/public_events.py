from django.utils import timezone

from apps.events.constants import EventStatus, Visibility
from apps.events.models import Event


class PublicEventsQuery:
    """
    Returns published, public, active events ordered by start datetime.
    """

    @staticmethod
    def execute():
        """
        Return queryset of publicly visible events.

        Returns:
            QuerySet of Event objects.
        """
        return Event.objects.filter(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            is_active=True,
            end_datetime__gte=timezone.now(),
        ).order_by("start_datetime")
