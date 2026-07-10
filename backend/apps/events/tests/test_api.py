import uuid

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.events.constants import EventStatus, Visibility, EventType
from apps.events.models import Event


@override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=False)
class EventApiTestCase(APITestCase):
    base_url = "/api/v1/events"

    def setUp(self):
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        user_service.activate_user(self.super_admin)

        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)

        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.valid_event_data = {
            "title": "Test Event",
            "description": "A test event",
            "location": "Test Location",
            "event_type": EventType.GENERAL,
            "start_datetime": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            "end_datetime": (timezone.now() + timezone.timedelta(days=2)).isoformat(),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }

    def _auth(self, user):
        self.client.force_authenticate(user)

    def _create_event(self, **overrides):
        data = {**self.valid_event_data, **overrides}
        return Event.objects.create(**data)


class PublicEventApiTest(EventApiTestCase):
    def test_list_public_events(self):
        self._create_event(status=EventStatus.PUBLISHED, visibility=Visibility.PUBLIC)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_public_events_excludes_draft(self):
        self._create_event(status=EventStatus.DRAFT)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_event_detail(self):
        event = self._create_event()
        response = self.client.get(f"{self.base_url}/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], event.title)

    def test_event_detail_not_found(self):
        response = self.client.get(
            f"{self.base_url}/events/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_live_events(self):
        now = timezone.now()
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now - timezone.timedelta(hours=1),
            end_datetime=now + timezone.timedelta(hours=1),
        )
        response = self.client.get(f"{self.base_url}/events/live/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_upcoming_events(self):
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        response = self.client.get(f"{self.base_url}/events/upcoming/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_past_events(self):
        now = timezone.now()
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now - timezone.timedelta(days=2),
            end_datetime=now - timezone.timedelta(days=1),
        )
        response = self.client.get(f"{self.base_url}/events/past/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class AdminEventApiTest(EventApiTestCase):
    def test_create_event_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Event")

    def test_create_event_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_event_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_events_as_admin(self):
        self._auth(self.super_admin)
        self._create_event()
        response = self.client.get(f"{self.base_url}/admin/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.patch(
            f"{self.base_url}/admin/events/{event.id}/",
            {"title": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated")

    def test_delete_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.delete(
            f"{self.base_url}/admin/events/{event.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_publish_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/publish/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], EventStatus.PUBLISHED)

    def test_unpublish_event(self):
        self._auth(self.super_admin)
        event = self._create_event(status=EventStatus.PUBLISHED)
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/unpublish/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], EventStatus.DRAFT)

    def test_activate_event(self):
        self._auth(self.super_admin)
        event = self._create_event(is_active=False)
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/activate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_active"])

    def test_deactivate_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_active"])
