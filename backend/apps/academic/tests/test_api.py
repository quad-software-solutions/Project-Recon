from datetime import date, timedelta

from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.academic.constants import ClassPeriod, ClassType
from apps.academic.models import Program, SubProgram, Class, Student, EnrollmentPeriod
from apps.academic.services import program_service, class_service, admission_service
from apps.academic.services.enrollment_period_service import (
    create_enrollment_period,
    deactivate_enrollment_period,
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



