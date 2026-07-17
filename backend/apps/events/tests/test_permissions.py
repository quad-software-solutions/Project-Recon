from django.test import TestCase
from django.test.client import RequestFactory

from apps.accounts.constants import AccountStatus
from apps.accounts.models import Branch, User
from apps.accounts.permissions.roles import Roles
from apps.accounts.services import user_service
from apps.events.api.permissions import (
    IsEventStaff,
    IsEventRegistrationStaff,
    IsEventStaffOrInstructor,
)
from apps.events.constants import EventStatus, EventType, Visibility
from apps.events.models import Event, Tournament, TournamentCategory, Workshop


class IsEventStaffTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.branch = Branch.objects.create(name="Main", code="MB")
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        user_service.activate_user(self.super_admin)

        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)

        self.secretary = user_service._create_user_with_role(
            "sec@test.com", "Sec", "User", self.password,
            status=AccountStatus.PENDING,
            is_email_verified=False,
            role=Roles.SECRETARY, branch=self.branch,
        )
        user_service.activate_user(self.secretary)

        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        from django.contrib.auth.models import AnonymousUser
        self.anon = AnonymousUser()

        self.event = Event.objects.create(
            title="Test", description="Desc", location="Loc",
            event_type=EventType.GENERAL,
            start_datetime="2025-01-01T00:00:00Z",
            end_datetime="2025-01-02T00:00:00Z",
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
            branch=self.branch,
        )
        self.other_branch = Branch.objects.create(name="Other", code="OB")
        self.other_event = Event.objects.create(
            title="Other", description="Desc", location="Loc",
            event_type=EventType.GENERAL,
            start_datetime="2025-01-01T00:00:00Z",
            end_datetime="2025-01-02T00:00:00Z",
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
            branch=self.other_branch,
        )

        self.permission = IsEventStaff()

    def _make_request(self, user):
        request = self.factory.get("/")
        request.user = user
        return request

    def test_super_admin_has_permission(self):
        request = self._make_request(self.super_admin)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_branch_manager_has_permission(self):
        request = self._make_request(self.branch_manager)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_secretary_does_not_have_permission(self):
        request = self._make_request(self.secretary)
        self.assertFalse(self.permission.has_permission(request, None))

    def test_student_does_not_have_permission(self):
        request = self._make_request(self.student)
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_does_not_have_permission(self):
        request = self._make_request(self.anon)
        self.assertFalse(self.permission.has_permission(request, None))

    def test_super_admin_has_object_permission(self):
        request = self._make_request(self.super_admin)
        self.assertTrue(self.permission.has_object_permission(request, None, self.event))

    def test_branch_manager_can_access_own_branch_event(self):
        request = self._make_request(self.branch_manager)
        self.assertTrue(self.permission.has_object_permission(request, None, self.event))

    def test_branch_manager_cannot_access_other_branch_event(self):
        request = self._make_request(self.branch_manager)
        self.assertFalse(self.permission.has_object_permission(request, None, self.other_event))


class IsEventRegistrationStaffTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.branch = Branch.objects.create(name="Main", code="MB")
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        user_service.activate_user(self.super_admin)

        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)

        self.secretary = user_service._create_user_with_role(
            "sec@test.com", "Sec", "User", self.password,
            status=AccountStatus.PENDING,
            is_email_verified=False,
            role=Roles.SECRETARY, branch=self.branch,
        )
        user_service.activate_user(self.secretary)

        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.permission = IsEventRegistrationStaff()

    def _make_request(self, user):
        request = self.factory.get("/")
        request.user = user
        return request

    def test_super_admin_has_permission(self):
        request = self._make_request(self.super_admin)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_branch_manager_has_permission(self):
        request = self._make_request(self.branch_manager)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_secretary_has_permission(self):
        request = self._make_request(self.secretary)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_student_does_not_have_permission(self):
        request = self._make_request(self.student)
        self.assertFalse(self.permission.has_permission(request, None))


class IsEventStaffOrInstructorTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.branch = Branch.objects.create(name="Main", code="MB")
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        user_service.activate_user(self.super_admin)

        self.instructor = user_service._create_user_with_role(
            "instr@test.com", "Inst", "Rctor", self.password,
            status=AccountStatus.PENDING,
            is_email_verified=False,
            role=Roles.INSTRUCTOR, branch=self.branch,
        )
        user_service.activate_user(self.instructor)

        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.event = Event.objects.create(
            title="WS Event", description="Desc", location="Loc",
            event_type=EventType.WORKSHOP,
            start_datetime="2025-01-01T00:00:00Z",
            end_datetime="2025-01-02T00:00:00Z",
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
            branch=self.branch,
        )
        self.other_event = Event.objects.create(
            title="Other WS", description="Desc", location="Loc",
            event_type=EventType.WORKSHOP,
            start_datetime="2025-01-01T00:00:00Z",
            end_datetime="2025-01-02T00:00:00Z",
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
            branch=self.branch,
        )
        self.workshop = Workshop.objects.create(
            event=self.event, instructor=self.instructor,
            duration_minutes=60,
        )
        self.other_instructor = user_service._create_user_with_role(
            "other@test.com", "Other", "Instr", self.password,
            status=AccountStatus.PENDING,
            is_email_verified=False,
            role=Roles.INSTRUCTOR, branch=self.branch,
        )
        user_service.activate_user(self.other_instructor)
        self.other_workshop = Workshop.objects.create(
            event=self.other_event, instructor=self.other_instructor,
            duration_minutes=60,
        )

        self.permission = IsEventStaffOrInstructor()

    def _make_request(self, user, method="GET"):
        request = self.factory.generic(method, "/")
        request.user = user
        return request

    def test_super_admin_has_permission(self):
        request = self._make_request(self.super_admin)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_instructor_has_permission(self):
        request = self._make_request(self.instructor)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_student_does_not_have_permission(self):
        request = self._make_request(self.student)
        self.assertFalse(self.permission.has_permission(request, None))

    def test_instructor_has_object_permission_on_own_workshop(self):
        request = self._make_request(self.instructor)
        self.assertTrue(
            self.permission.has_object_permission(request, None, self.workshop)
        )

    def test_instructor_cannot_access_other_workshop(self):
        request = self._make_request(self.instructor)
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.other_workshop)
        )

    def test_super_admin_can_access_any_workshop(self):
        request = self._make_request(self.super_admin)
        self.assertTrue(
            self.permission.has_object_permission(request, None, self.other_workshop)
        )

    def test_instructor_cannot_post(self):
        request = self._make_request(self.instructor, "POST")
        self.assertFalse(self.permission.has_permission(request, None))

    def test_instructor_cannot_delete(self):
        request = self._make_request(self.instructor, "DELETE")
        self.assertTrue(self.permission.has_permission(request, None))
