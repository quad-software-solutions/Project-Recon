from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.constants import EventStatus, Visibility, EventType, RegistrationMode
from apps.events.models import Event
from apps.events.services.event_service import (
    create_event,
    get_event_or_404,
    list_events,
    update_event,
    delete_event,
    publish_event,
    unpublish_event,
    activate_event,
    deactivate_event,
)


class EventServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Event",
            "description": "Description",
            "location": "Location",
            "event_type": EventType.GENERAL,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }

    def test_create_event(self):
        event = create_event(self.valid_data)
        self.assertEqual(event.title, "Test Event")
        self.assertEqual(event.event_type, EventType.GENERAL)

    def test_create_event_invalid_dates(self):
        data = {**self.valid_data}
        data["start_datetime"] = timezone.now() + timezone.timedelta(days=2)
        data["end_datetime"] = timezone.now() + timezone.timedelta(days=1)
        with self.assertRaises(ValidationError):
            create_event(data)

    def test_create_event_registration_config_missing_mode(self):
        data = {**self.valid_data, "registration_enabled": True}
        with self.assertRaises(ValidationError):
            create_event(data)

    def test_get_event_or_404_found(self):
        event = create_event(self.valid_data)
        found = get_event_or_404(event.id)
        self.assertEqual(found.id, event.id)

    def test_get_event_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_event_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_events(self):
        create_event(self.valid_data)
        create_event({**self.valid_data, "title": "Event 2"})
        events = list_events()
        self.assertEqual(events.count(), 2)

    def test_update_event(self):
        event = create_event(self.valid_data)
        updated = update_event(event, {"title": "Updated Title"})
        self.assertEqual(updated.title, "Updated Title")

    def test_update_event_invalid_dates(self):
        event = create_event(self.valid_data)
        with self.assertRaises(ValidationError):
            update_event(
                event,
                {
                    "start_datetime": timezone.now() + timezone.timedelta(days=2),
                    "end_datetime": timezone.now() + timezone.timedelta(days=1),
                },
            )

    def test_delete_event(self):
        event = create_event(self.valid_data)
        delete_event(event)
        with self.assertRaises(NotFound):
            get_event_or_404(event.id)

    def test_publish_event(self):
        event = create_event(self.valid_data)
        published = publish_event(event)
        self.assertEqual(published.status, EventStatus.PUBLISHED)

    def test_publish_event_not_draft(self):
        event = create_event(self.valid_data)
        publish_event(event)
        with self.assertRaises(ValidationError):
            publish_event(event)

    def test_unpublish_event(self):
        event = create_event(self.valid_data)
        publish_event(event)
        unpublished = unpublish_event(event)
        self.assertEqual(unpublished.status, EventStatus.DRAFT)

    def test_unpublish_event_not_published(self):
        event = create_event(self.valid_data)
        with self.assertRaises(ValidationError):
            unpublish_event(event)

    def test_activate_event(self):
        event = create_event({**self.valid_data, "is_active": False})
        activated = activate_event(event)
        self.assertTrue(activated.is_active)

    def test_deactivate_event(self):
        event = create_event(self.valid_data)
        deactivated = deactivate_event(event)
        self.assertFalse(deactivated.is_active)
