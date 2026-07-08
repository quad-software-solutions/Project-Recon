from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.academic.constants import (
    ClassPeriod, ClassType, AttendanceStatus, SessionStatus,
    EnrollmentStatus, PaymentMethod, PaymentStatus,
)
from apps.academic.models import (
    Program, SubProgram, Class, Student, EnrollmentPeriod,
    StaffAttendanceSession, Enrollment, EnrollmentPayment,
    AttendanceSession, AttendanceRecord,
)
from apps.academic.services import program_service, class_service, admission_service, attendance_service
from apps.academic.services.enrollment_period_service import (
    create_enrollment_period,
    deactivate_enrollment_period,
)
from apps.academic.services.staff_attendance_service import (
    create_session,
    publish_session,
    soft_delete_session,
    upsert_records,
)
from apps.academic.services.enrollment_service import (
    enroll_student,
)
from apps.academic.services.payment_service import (
    create_cash_payment,
)
from apps.accounts.models import Branch, UserAssignment
from apps.accounts.constants import Roles
from apps.accounts.services import user_service


class AcademicAPITestCase(APITestCase):
    base_url = "/api/v1/academic"

    def setUp(self):
        self.password = "StrongP@ssw0rd!2026"
        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.instructor = user_service.create_staff_user(
            "instructor@test.com",
            "John",
            "Doe",
            self.password,
            branch=self.branch,
        )

    def _authenticate(self, user):
        token = str(AccessToken.for_user(user))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def authenticate_as_super_admin(self):
        self._authenticate(self.super_admin)

    def authenticate_as_branch_manager(self):
        manager = user_service.create_staff_user(
            "manager@test.com",
            "Branch",
            "Manager",
            self.password,
            branch=self.branch,
            role=Roles.BRANCH_MANAGER,
        )
        user_service.activate_user(manager)
        manager.is_email_verified = True
        manager.save()
        self._authenticate(manager)
        return manager

    def authenticate_as_student(self):
        student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(student)
        student.is_email_verified = True
        student.save()
        self._authenticate(student)
        return student

    def authenticate_as_secretary(self):
        secretary = user_service.create_staff_user(
            "secretary@test.com",
            "Branch",
            "Secretary",
            self.password,
            branch=self.branch,
            role=Roles.SECRETARY,
        )
        user_service.activate_user(secretary)
        secretary.is_email_verified = True
        secretary.save()
        self._authenticate(secretary)
        return secretary


class ProgramAPITest(AcademicAPITestCase):
    def test_list_programs_public(self):
        program_service.create_program(name="Programming", slug="programming")
        response = self.client.get(f"{self.base_url}/programs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_program_public(self):
        program = program_service.create_program(name="Programming", slug="programming")
        response = self.client.get(f"{self.base_url}/programs/{program.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Programming")

    def test_create_program_unauthenticated_returns_401(self):
        data = {"name": "Programming", "slug": "programming"}
        response = self.client.post(f"{self.base_url}/programs/", data, format="json")
        self.assertEqual(response.status_code, 401)

    def test_create_program_as_super_admin(self):
        self.authenticate_as_super_admin()
        data = {
            "name": "Programming",
            "slug": "programming",
            "description": "Learn programming",
        }
        response = self.client.post(f"{self.base_url}/programs/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Programming")

    def test_create_program_as_branch_manager(self):
        self.authenticate_as_branch_manager()
        data = {"name": "Robotics", "slug": "robotics"}
        response = self.client.post(f"{self.base_url}/programs/", data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_create_program_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {"name": "Languages", "slug": "languages"}
        response = self.client.post(f"{self.base_url}/programs/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_list_programs(self):
        self.authenticate_as_super_admin()
        program_service.create_program(name="Programming", slug="programming")
        program_service.create_program(name="Robotics", slug="robotics")
        response = self.client.get(f"{self.base_url}/programs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_retrieve_program(self):
        self.authenticate_as_super_admin()
        program = program_service.create_program(name="Programming", slug="programming")
        response = self.client.get(f"{self.base_url}/programs/{program.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Programming")

    def test_update_program(self):
        self.authenticate_as_super_admin()
        program = program_service.create_program(name="Programming", slug="programming")
        response = self.client.patch(
            f"{self.base_url}/programs/{program.pk}/",
            {"name": "Advanced Programming"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Advanced Programming")

    def test_activate_program(self):
        self.authenticate_as_super_admin()
        program = program_service.create_program(name="Programming", slug="programming")
        program_service.deactivate_program(program)
        response = self.client.post(f"{self.base_url}/programs/{program.pk}/activate/")
        self.assertEqual(response.status_code, 200)
        program.refresh_from_db()
        self.assertTrue(program.is_active)

    def test_deactivate_program(self):
        self.authenticate_as_super_admin()
        program = program_service.create_program(name="Programming", slug="programming")
        response = self.client.post(f"{self.base_url}/programs/{program.pk}/deactivate/")
        self.assertEqual(response.status_code, 200)
        program.refresh_from_db()
        self.assertFalse(program.is_active)


class SubProgramAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )

    def test_list_sub_programs_public(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_sub_program_public(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/{sub.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Python")

    def test_create_sub_program_unauthenticated_returns_401(self):
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "fee": "500.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 401)

    def test_create_sub_program(self):
        self.authenticate_as_super_admin()
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "fee": "500.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Python")

    def test_create_sub_program_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "fee": "500.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_list_sub_programs(self):
        self.authenticate_as_super_admin()
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/")
        self.assertEqual(response.status_code, 200)

    def test_update_sub_program(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"fee": "600.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_deactivate_sub_program(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        response = self.client.post(f"{self.base_url}/sub-programs/{sub.pk}/deactivate/")
        self.assertEqual(response.status_code, 200)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)


class ClassAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )

    def test_list_classes_requires_auth(self):
        response = self.client.get(f"{self.base_url}/classes/")
        self.assertEqual(response.status_code, 401)

    def test_create_group_class(self):
        self.authenticate_as_super_admin()
        data = {
            "sub_program": str(self.sub_program.pk),
            "branch": str(self.branch.pk),
            "instructor": str(self.instructor.pk),
            "name": "Python Group A",
            "class_type": ClassType.GROUP,
            "class_period": ClassPeriod.FULL_DAY,
            "capacity": 20,
        }
        response = self.client.post(f"{self.base_url}/classes/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Python Group A")

    def test_create_individual_class(self):
        self.authenticate_as_super_admin()
        data = {
            "sub_program": str(self.sub_program.pk),
            "branch": str(self.branch.pk),
            "instructor": str(self.instructor.pk),
            "name": "Python Individual",
            "class_type": ClassType.INDIVIDUAL,
        }
        response = self.client.post(f"{self.base_url}/classes/", data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_create_class_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {
            "sub_program": str(self.sub_program.pk),
            "branch": str(self.branch.pk),
            "instructor": str(self.instructor.pk),
            "name": "Python Group A",
            "class_type": ClassType.GROUP,
            "class_period": ClassPeriod.HALF_DAY,
            "capacity": 20,
        }
        response = self.client.post(f"{self.base_url}/classes/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_assign_instructor(self):
        self.authenticate_as_super_admin()
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        new_instructor = user_service.create_staff_user(
            "new-instructor@test.com",
            "Jane",
            "Doe",
            self.password,
            branch=self.branch,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{klass.pk}/assign-instructor/",
            {"instructor": str(new_instructor.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_list_classes(self):
        self.authenticate_as_super_admin()
        class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY,
            capacity=20,
        )
        response = self.client.get(f"{self.base_url}/classes/")
        self.assertEqual(response.status_code, 200)

    def test_activate_class(self):
        self.authenticate_as_super_admin()
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        class_service.deactivate_class(klass)
        response = self.client.post(f"{self.base_url}/classes/{klass.pk}/activate/")
        self.assertEqual(response.status_code, 200)
        klass.refresh_from_db()
        self.assertTrue(klass.is_active)


class AdmissionAPITest(AcademicAPITestCase):
    def test_admit_unauthenticated_returns_401(self):
        data = {
            "email": "new-student@test.com",
            "first_name": "New",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.assertEqual(response.status_code, 401)

    def test_admit_as_super_admin(self):
        self.authenticate_as_super_admin()
        data = {
            "email": "new-student@test.com",
            "first_name": "New",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "new-student@test.com")
        self.assertEqual(response.json()["first_name"], "New")
        self.assertTrue(Student.objects.filter(user__email="new-student@test.com").exists())

    def test_admit_as_branch_manager(self):
        self.authenticate_as_branch_manager()
        data = {
            "email": "bm-student@test.com",
            "first_name": "BM",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_admit_as_secretary(self):
        self.authenticate_as_secretary()
        data = {
            "email": "sec-student@test.com",
            "first_name": "Sec",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_admit_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {
            "email": "stu-student@test.com",
            "first_name": "Stu",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.assertEqual(response.status_code, 403)


class StudentAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.authenticate_as_super_admin()
        data = {
            "email": "api-student@test.com",
            "first_name": "API",
            "last_name": "Student",
            "password": "StrongP@ssw0rd!2026",
            "branch": str(self.branch.pk),
        }
        response = self.client.post(f"{self.base_url}/admissions/", data, format="json")
        self.student_pk = response.json()["id"]

    def test_retrieve_student(self):
        response = self.client.get(f"{self.base_url}/students/{self.student_pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "api-student@test.com")

    def test_retrieve_student_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f"{self.base_url}/students/{self.student_pk}/")
        self.assertEqual(response.status_code, 401)

    def test_update_student(self):
        response = self.client.patch(
            f"{self.base_url}/students/{self.student_pk}/",
            {"first_name": "UpdatedAPI"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "UpdatedAPI")

    def test_search_students(self):
        response = self.client.get(f"{self.base_url}/students/search/?q=api-student")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_search_students_empty_query(self):
        response = self.client.get(f"{self.base_url}/students/search/?q=")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_deactivate_student(self):
        response = self.client.post(f"{self.base_url}/students/{self.student_pk}/deactivate/")
        self.assertEqual(response.status_code, 200)
        student = Student.objects.get(pk=self.student_pk)
        self.assertFalse(student.is_active)

    def test_activate_student(self):
        Student.objects.filter(pk=self.student_pk).update(is_active=False)
        response = self.client.post(f"{self.base_url}/students/{self.student_pk}/activate/")
        self.assertEqual(response.status_code, 200)
        student = Student.objects.get(pk=self.student_pk)
        self.assertTrue(student.is_active)


class EnrollmentPeriodAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        self.period = create_enrollment_period(
            actor=None,
            branch=self.branch,
            program=self.program,
            sub_program=self.sub_program,
            class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY,
            title="Fall 2026",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.period_pk = str(self.period.pk)

    def test_list_enrollment_periods(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/enrollment-periods/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_create_enrollment_period(self):
        self.authenticate_as_super_admin()
        data = {
            "branch": str(self.branch.pk),
            "program": str(self.program.pk),
            "sub_program": str(self.sub_program.pk),
            "class_type": ClassType.GROUP,
            "class_period": ClassPeriod.FULL_DAY,
            "title": "Spring 2026",
            "start_date": "2026-03-01",
            "end_date": "2026-03-31",
        }
        response = self.client.post(f"{self.base_url}/enrollment-periods/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["title"], "Spring 2026")

    def test_create_enrollment_period_as_secretary(self):
        self.authenticate_as_secretary()
        data = {
            "branch": str(self.branch.pk),
            "program": str(self.program.pk),
            "sub_program": str(self.sub_program.pk),
            "class_type": ClassType.GROUP,
            "class_period": ClassPeriod.FULL_DAY,
            "title": "Summer 2026",
            "start_date": "2026-06-01",
            "end_date": "2026-06-30",
        }
        response = self.client.post(f"{self.base_url}/enrollment-periods/", data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_create_enrollment_period_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {
            "branch": str(self.branch.pk),
            "program": str(self.program.pk),
            "sub_program": str(self.sub_program.pk),
            "class_type": ClassType.GROUP,
            "title": "Unauthorized",
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        }
        response = self.client.post(f"{self.base_url}/enrollment-periods/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_retrieve_enrollment_period(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/enrollment-periods/{self.period_pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Fall 2026")

    def test_update_enrollment_period(self):
        self.authenticate_as_super_admin()
        response = self.client.patch(
            f"{self.base_url}/enrollment-periods/{self.period_pk}/",
            {"title": "Fall 2026 Extended"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Fall 2026 Extended")

    def test_activate_enrollment_period(self):
        self.authenticate_as_super_admin()
        deactivate_enrollment_period(actor=None, period=self.period)
        response = self.client.post(f"{self.base_url}/enrollment-periods/{self.period_pk}/activate/")
        self.assertEqual(response.status_code, 200)
        self.period.refresh_from_db()
        self.assertTrue(self.period.is_active)

    def test_deactivate_enrollment_period(self):
        self.authenticate_as_super_admin()
        response = self.client.post(f"{self.base_url}/enrollment-periods/{self.period_pk}/deactivate/")
        self.assertEqual(response.status_code, 200)
        self.period.refresh_from_db()
        self.assertFalse(self.period.is_active)


class StaffAttendanceAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.instructor = user_service.create_staff_user(
            "staff-attendance-instructor@test.com", "Jane", "Staff", self.password,
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/",
            {"branch": str(self.branch.pk), "date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.session_pk = response.json()["id"]
        self.session = StaffAttendanceSession.objects.get(pk=self.session_pk)

    def test_list_sessions(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/staff-attendance/sessions/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_list_sessions_filters_by_branch(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/staff-attendance/sessions/?branch={self.branch.pk}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_session(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], SessionStatus.DRAFT)

    def test_update_session_notes(self):
        self.authenticate_as_super_admin()
        response = self.client.patch(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/",
            {"notes": "All staff present"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["notes"], "All staff present")

    def test_soft_delete_session(self):
        self.authenticate_as_super_admin()
        response = self.client.delete(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/",
        )
        self.assertEqual(response.status_code, 204)
        self.session.refresh_from_db()
        self.assertFalse(self.session.is_active)

    def test_publish_session(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/publish/",
        )
        self.assertEqual(response.status_code, 200)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, SessionStatus.PUBLISHED)

    def test_upsert_records(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/",
            [{"staff_member": str(self.instructor.pk), "status": AttendanceStatus.PRESENT}],
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["status"], AttendanceStatus.PRESENT)

    def test_upsert_records_single(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/",
            {"staff_member": str(self.instructor.pk), "status": AttendanceStatus.LATE},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["status"], AttendanceStatus.LATE)

    def test_upsert_records_after_publish_returns_400(self):
        self.authenticate_as_super_admin()
        publish_session(None, self.session)
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/",
            [{"staff_member": str(self.instructor.pk), "status": AttendanceStatus.PRESENT}],
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_update_record(self):
        self.authenticate_as_super_admin()
        create = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/",
            {"staff_member": str(self.instructor.pk), "status": AttendanceStatus.PRESENT},
            format="json",
        )
        record_pk = create.json()[0]["id"]
        response = self.client.patch(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/{record_pk}/",
            {"status": AttendanceStatus.ABSENT},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], AttendanceStatus.ABSENT)

    def test_delete_record(self):
        self.authenticate_as_super_admin()
        create = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/",
            {"staff_member": str(self.instructor.pk), "status": AttendanceStatus.PRESENT},
            format="json",
        )
        record_pk = create.json()[0]["id"]
        response = self.client.delete(
            f"{self.base_url}/staff-attendance/sessions/{self.session_pk}/records/{record_pk}/",
        )
        self.assertEqual(response.status_code, 204)

    def test_available_staff(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/staff-attendance/sessions/available-staff/?branch={self.branch.pk}",
        )
        self.assertEqual(response.status_code, 200)
        staff_ids = [s["id"] for s in response.json()]
        self.assertIn(str(self.instructor.pk), staff_ids)

    def test_create_session_as_branch_manager(self):
        self.authenticate_as_branch_manager()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/",
            {"branch": str(self.branch.pk), "date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_session_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/",
            {"branch": str(self.branch.pk), "date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_session_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(
            f"{self.base_url}/staff-attendance/sessions/",
            {"branch": str(self.branch.pk), "date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 401)


class EnrollmentAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "testenroll@test.com", "Test", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_user.is_email_verified = True
        self.student_user.save()
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )

        self.group_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Python Group A", class_type=ClassType.GROUP, class_period=ClassPeriod.FULL_DAY,
            capacity=20,
        )
        self.individual_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Python Individual", class_type=ClassType.INDIVIDUAL,
        )
        create_enrollment_period(
            actor=None, branch=self.branch, program=self.program,
            sub_program=self.sub_program, class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY, title="Fall 2026",
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() + timedelta(days=30),
        )

    def test_list_enrollments_unauthenticated_returns_401(self):
        response = self.client.get(f"{self.base_url}/enrollments/")
        self.assertEqual(response.status_code, 401)

    def test_list_enrollments_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/enrollments/")
        self.assertEqual(response.status_code, 200)

    def test_enroll_student_as_secretary(self):
        self.authenticate_as_secretary()
        data = {
            "student": str(self.student_model.pk),
            "enrolled_class": str(self.individual_class.pk),
        }
        response = self.client.post(f"{self.base_url}/enrollments/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], EnrollmentStatus.PENDING_PAYMENT)

    def test_enroll_student_as_student_returns_403(self):
        self.authenticate_as_student()
        data = {
            "student": str(self.student_model.pk),
            "enrolled_class": str(self.individual_class.pk),
        }
        response = self.client.post(f"{self.base_url}/enrollments/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_cancel_enrollment(self):
        self.authenticate_as_super_admin()
        enrollment = enroll_student(None, student=self.student_model, enrolled_class=self.individual_class)
        response = self.client.post(f"{self.base_url}/enrollments/{enrollment.pk}/cancel/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], EnrollmentStatus.CANCELLED)

    def test_complete_enrollment(self):
        self.authenticate_as_super_admin()
        enrollment = enroll_student(None, student=self.student_model, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()
        response = self.client.post(f"{self.base_url}/enrollments/{enrollment.pk}/complete/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], EnrollmentStatus.COMPLETED)

    @patch("apps.academic.services.payment_service.shared_initialize_payment")
    def test_online_enrollment_new_student(self, mock_init):
        mock_init.return_value = {
            "provider": "chapa", "reference": "ENROLL-aaaaaaaa-aaaaaaaaaaaa",
            "checkout_url": "https://checkout.chapa.co/abc",
        }
        response = self.client.post(
            f"{self.base_url}/enrollments/online/",
            {
                "enrolled_class": str(self.individual_class.pk),
                "callback_url": "https://example.com/webhook",
                "return_url": "https://example.com/redirect",
                "email": "newstudent@test.com",
                "first_name": "New",
                "last_name": "Student",
                "password": "TestPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("checkout_url", response.json())
        self.assertEqual(response.json()["enrollment"]["status"], EnrollmentStatus.PENDING_PAYMENT)

    def test_online_enrollment_unauthenticated_missing_fields_raises(self):
        response = self.client.post(
            f"{self.base_url}/enrollments/online/",
            {
                "enrolled_class": str(self.individual_class.pk),
                "callback_url": "https://example.com/webhook",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_online_enrollment_group_without_period_raises(self):
        deactivate_enrollment_period(None, EnrollmentPeriod.objects.first())
        response = self.client.post(
            f"{self.base_url}/enrollments/online/",
            {
                "enrolled_class": str(self.group_class.pk),
                "callback_url": "https://example.com/webhook",
                "email": "new@test.com",
                "first_name": "New",
                "last_name": "Student",
                "password": "TestPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class PaymentAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(name="Programming", slug="programming")
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "testpayment@test.com", "Test", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Python Test", class_type=ClassType.INDIVIDUAL,
        )
        self.enrollment = enroll_student(None, student=self.student_model, enrolled_class=self.klass)

    def test_list_payments_unauthenticated_returns_401(self):
        response = self.client.get(f"{self.base_url}/payments/")
        self.assertEqual(response.status_code, 401)

    def test_list_payments_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/payments/")
        self.assertEqual(response.status_code, 200)

    def test_create_cash_payment_as_secretary(self):
        self.authenticate_as_secretary()
        response = self.client.post(
            f"{self.base_url}/payments/cash/",
            {"enrollment": str(self.enrollment.pk), "amount": "500.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], PaymentStatus.PAID)

    def test_create_cash_payment_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/payments/cash/",
            {"enrollment": str(self.enrollment.pk), "amount": "500.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_online_verify_public(self):
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.ONLINE,
            payment_provider="CHAPA",
            transaction_reference="ENROLL-abcd1234-abcdef123456",
            status=PaymentStatus.PENDING,
        )
        with patch("apps.academic.services.payment_service.shared_verify_payment") as mock_v:
            mock_v.return_value = {
                "provider": "chapa", "status": "success", "provider_status": "success",
                "reference": "ENROLL-abcd1234-abcdef123456", "provider_transaction_id": "tx_123",
                "amount": Decimal("500.00"), "currency": "ETB", "raw": {},
            }
            response = self.client.post(
                f"{self.base_url}/enrollments/online/verify/",
                {"reference": "ENROLL-abcd1234-abcdef123456"},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], PaymentStatus.PAID)

    def test_online_verify_bad_reference_returns_400(self):
        response = self.client.post(
            f"{self.base_url}/enrollments/online/verify/",
            {"reference": "bad-ref"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_online_webhook(self):
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.ONLINE,
            payment_provider="CHAPA",
            transaction_reference="ENROLL-abcf0000-abcdef123456",
            status=PaymentStatus.PENDING,
        )
        with patch("apps.academic.services.payment_service.shared_verify_payment") as mock_v:
            mock_v.return_value = {
                "provider": "chapa", "status": "success", "provider_status": "success",
                "reference": "ENROLL-abcf0000-abcdef123456", "provider_transaction_id": "tx_wh",
                "amount": Decimal("500.00"), "currency": "ETB", "raw": {},
            }
            response = self.client.post(
                f"{self.base_url}/enrollments/online/webhook/",
                {"tx_ref": "ENROLL-abcf0000-abcdef123456"},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")


class AttendanceAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()

        self.program = Program.objects.create(name="Att Program", slug="att-program")
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Att Sub", slug="att-sub", fee=Decimal("500.00"),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="API Att Class",
            class_type=ClassType.INDIVIDUAL,
        )
        self.student_user = user_service.create_student_user(
            "api-att-student@test.com", "API", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )

    def test_create_session_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/",
            {"enrolled_class": str(self.klass.pk), "session_date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())

    def test_create_session_as_instructor(self):
        self._authenticate(self.instructor)
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/",
            {"enrolled_class": str(self.klass.pk), "session_date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_session_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/",
            {"enrolled_class": str(self.klass.pk), "session_date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_session_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/",
            {"enrolled_class": str(self.klass.pk), "session_date": str(date.today())},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_sessions(self):
        self.authenticate_as_super_admin()
        attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        response = self.client.get(f"{self.base_url}/attendance/sessions/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_session(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        response = self.client.get(f"{self.base_url}/attendance/sessions/{session.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["topic"], "")

    def test_update_session(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        response = self.client.patch(
            f"{self.base_url}/attendance/sessions/{session.pk}/",
            {"topic": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["topic"], "Updated")

    def test_bulk_record_attendance(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/{session.pk}/records/",
            [{"enrollment": str(self.enrollment.pk), "status": AttendanceStatus.PRESENT}],
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["status"], AttendanceStatus.PRESENT)

    def test_bulk_record_attendance_single(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        response = self.client.post(
            f"{self.base_url}/attendance/sessions/{session.pk}/records/",
            {"enrollment": str(self.enrollment.pk), "status": AttendanceStatus.LATE},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 1)

    def test_update_record(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        create = self.client.post(
            f"{self.base_url}/attendance/sessions/{session.pk}/records/",
            {"enrollment": str(self.enrollment.pk), "status": AttendanceStatus.PRESENT},
            format="json",
        )
        record_pk = create.json()[0]["id"]
        response = self.client.patch(
            f"{self.base_url}/attendance/sessions/{session.pk}/records/{record_pk}/",
            {"status": AttendanceStatus.ABSENT},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], AttendanceStatus.ABSENT)

    def test_enrollment_attendance_history(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        response = self.client.get(
            f"{self.base_url}/attendance/enrollments/{self.enrollment.pk}/history/",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_enrollment_attendance_summary(self):
        self.authenticate_as_super_admin()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass, session_date=date.today(),
        )
        attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        response = self.client.get(
            f"{self.base_url}/attendance/enrollments/{self.enrollment.pk}/summary/",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["present"], 1)

