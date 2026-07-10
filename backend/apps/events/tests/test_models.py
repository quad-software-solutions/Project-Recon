from django.test import TestCase
from django.utils import timezone

from apps.events.constants import EventStatus, Visibility, EventType
from apps.events.models import Event


class EventModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Test Event",
            description="A test event description.",
            location="Test Location",
            event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )

    def test_create_event(self):
        self.assertEqual(str(self.event), "Test Event")
        self.assertEqual(self.event.event_type, EventType.GENERAL)
        self.assertEqual(self.event.status, EventStatus.DRAFT)

    def test_event_defaults(self):
        self.assertTrue(self.event.is_active)
        self.assertFalse(self.event.registration_enabled)
        self.assertFalse(self.event.payment_required)
        self.assertEqual(self.event.enrolled_count, 0)

    def test_event_uuid_pk(self):
        self.assertIsNotNone(self.event.id)
        self.assertEqual(len(str(self.event.id)), 36)

    def test_event_timestamps(self):
        self.assertIsNotNone(self.event.created_at)
        self.assertIsNotNone(self.event.updated_at)
