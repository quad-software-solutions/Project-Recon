import os
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.academic.constants import (
    ClassPeriod, ClassType, AttendanceStatus, SessionStatus,
    EnrollmentStatus, PaymentMethod, PaymentStatus, VerificationStatus,
    ProgressStatus,
)
from apps.academic.models import (
    BranchTransferRequest, Program, SubProgram, Class, Student, EnrollmentPeriod,
    StaffAttendanceSession, StaffAttendanceRecord, Enrollment, EnrollmentPayment,
    AttendanceSession, AttendanceRecord, LearningMilestone, StudentProgress,
    Certificate,
)
from apps.academic.services import program_service, class_service, admission_service, attendance_service
from apps.academic.services import progress_service
from apps.academic.services import learning_material_service
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
    record_payment,
)
from apps.academic.services.transfer_service import (
    approve_transfer,
    request_transfer,
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

    def _create_temp_file(self, name="test.pdf"):
        from io import BytesIO
        from PIL import Image
        ext = os.path.splitext(name)[1].lower()
        if ext == ".pdf":
            content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
        elif ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            buf = BytesIO()
            img = Image.new("RGB", (1, 1), color="red")
            if ext in (".jpg", ".jpeg"):
                img.save(buf, format="JPEG")
            elif ext == ".png":
                img.save(buf, format="PNG")
            elif ext == ".gif":
                img.save(buf, format="GIF")
            elif ext == ".webp":
                img.save(buf, format="WebP")
            content = buf.getvalue()
        else:
            content = b"test content"
        from django.core.files.base import ContentFile
        return ContentFile(content, name=name)

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

    def test_create_program_with_image(self):
        self.authenticate_as_super_admin()
        image = self._create_temp_file(name="program.png")
        data = {"name": "Robotics", "slug": "robotics", "image": image, "supports_group": True, "supports_individual": True}
        response = self.client.post(f"{self.base_url}/programs/", data, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertIn("image", response.json())
        self.assertTrue(response.json()["image"])

    def test_update_program_image(self):
        self.authenticate_as_super_admin()
        program = program_service.create_program(name="Programming", slug="programming")
        image = self._create_temp_file(name="new_image.png")
        response = self.client.patch(
            f"{self.base_url}/programs/{program.pk}/",
            {"image": image},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("image", response.json())
        self.assertTrue(response.json()["image"])

    def test_clear_program_image(self):
        self.authenticate_as_super_admin()
        image = self._create_temp_file(name="program.png")
        program = program_service.create_program(name="Robotics", slug="robotics")
        response = self.client.patch(
            f"{self.base_url}/programs/{program.pk}/",
            {"image": image},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("image", response.json())
        self.assertTrue(response.json()["image"])
        response = self.client.patch(
            f"{self.base_url}/programs/{program.pk}/",
            {"image": ""},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["image"])


class SubProgramAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )

    def test_list_sub_programs_public(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_sub_program_public(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/{sub.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Python")

    def test_create_sub_program_unauthenticated_returns_401(self):
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "group_fee": "500.00",
            "individual_fee": "500.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 401)

    def test_create_sub_program(self):
        self.authenticate_as_super_admin()
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "group_fee": "500.00",
            "individual_fee": "500.00",
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
            "group_fee": "500.00",
            "individual_fee": "500.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_list_sub_programs(self):
        self.authenticate_as_super_admin()
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.get(f"{self.base_url}/sub-programs/")
        self.assertEqual(response.status_code, 200)

    def test_update_sub_program(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"group_fee": "600.00", "individual_fee": "600.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_deactivate_sub_program(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.post(f"{self.base_url}/sub-programs/{sub.pk}/deactivate/")
        self.assertEqual(response.status_code, 200)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

    def test_create_sub_program_negative_fee_returns_400(self):
        self.authenticate_as_super_admin()
        data = {
            "program": str(self.program.pk),
            "name": "Bad",
            "slug": "bad",
            "group_fee": "-100.00",
            "individual_fee": "-100.00",
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_update_sub_program_negative_fee_returns_400(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"group_fee": "-50.00", "individual_fee": "-50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_sub_program_with_image(self):
        self.authenticate_as_super_admin()
        image = self._create_temp_file(name="sub_program.png")
        data = {
            "program": str(self.program.pk),
            "name": "Python",
            "slug": "python",
            "group_fee": "500.00",
            "individual_fee": "500.00",
            "image": image,
        }
        response = self.client.post(f"{self.base_url}/sub-programs/", data, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertIn("image", response.json())
        self.assertTrue(response.json()["image"])

    def test_update_sub_program_image(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        image = self._create_temp_file(name="new_image.png")
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"image": image},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("image", response.json())
        self.assertTrue(response.json()["image"])

    def test_clear_sub_program_image(self):
        self.authenticate_as_super_admin()
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        image = self._create_temp_file(name="sub_program.png")
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"image": image},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["image"])
        response = self.client.patch(
            f"{self.base_url}/sub-programs/{sub.pk}/",
            {"image": ""},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["image"])


class ClassAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
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
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
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
            program=self.program, name="Python", slug="python", group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
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
        self.assertEqual(response.json()["status"], EnrollmentStatus.PENDING_VERIFICATION)

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

    def test_online_enrollment_new_student(self):
        response = self.client.post(
            f"{self.base_url}/enrollments/online/",
            {
                "enrolled_class": str(self.individual_class.pk),
                "email": "newstudent@test.com",
                "first_name": "New",
                "last_name": "Student",
                "password": "TestPass123!",
                "payment_method": "BANK_TRANSFER",
                "transaction_reference": "TXN-ONLINE-001",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], EnrollmentStatus.PENDING_VERIFICATION)
        self.assertIsNotNone(response.json().get("pending_code"))

    def test_online_enrollment_unauthenticated_missing_fields_raises(self):
        response = self.client.post(
            f"{self.base_url}/enrollments/online/",
            {
                "enrolled_class": str(self.individual_class.pk),
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
                "email": "new@test.com",
                "first_name": "New",
                "last_name": "Student",
                "password": "TestPass123!",
                "payment_method": "CASH",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def _create_active_enrollment(self):
        enrollment = enroll_student(
            None, student=self.student_model, enrolled_class=self.individual_class,
        )
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()
        return enrollment

    def test_move_enrollment_as_super_admin(self):
        self.authenticate_as_super_admin()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Move Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/enrollments/{enrollment.pk}/move/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["enrolled_class"], str(target_class.pk))

    def test_move_enrollment_unauthenticated_returns_401(self):
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Move Target 401", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/enrollments/{enrollment.pk}/move/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_move_enrollment_as_student_returns_403(self):
        self.authenticate_as_student()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Move Target 403", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/enrollments/{enrollment.pk}/move/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_move_enrollment_inactive_target_returns_400(self):
        self.authenticate_as_super_admin()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Inactive Move Target", class_type=ClassType.INDIVIDUAL,
        )
        class_service.deactivate_class(target_class)
        response = self.client.post(
            f"{self.base_url}/enrollments/{enrollment.pk}/move/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_move_enrollment_non_active_returns_400(self):
        self.authenticate_as_super_admin()
        enrollment = enroll_student(
            None, student=self.student_model, enrolled_class=self.individual_class,
        )
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Non-Active Move", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/enrollments/{enrollment.pk}/move/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_split_class_by_ids_as_super_admin(self):
        self.authenticate_as_super_admin()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Split Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{self.individual_class.pk}/split/",
            {
                "target_class": str(target_class.pk),
                "enrollment_ids": [str(enrollment.pk)],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["enrolled_class"], str(target_class.pk))

    def test_split_class_by_count_as_super_admin(self):
        self.authenticate_as_super_admin()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Split Count Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{self.individual_class.pk}/split/",
            {
                "target_class": str(target_class.pk),
                "count": 1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_split_class_unauthenticated_returns_401(self):
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Split 401 Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{self.individual_class.pk}/split/",
            {
                "target_class": str(target_class.pk),
                "count": 1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_split_class_as_student_returns_403(self):
        self.authenticate_as_student()
        enrollment = self._create_active_enrollment()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Split 403 Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{self.individual_class.pk}/split/",
            {
                "target_class": str(target_class.pk),
                "count": 1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_split_class_no_args_returns_400(self):
        self.authenticate_as_super_admin()
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Split No Args Target", class_type=ClassType.INDIVIDUAL,
        )
        response = self.client.post(
            f"{self.base_url}/classes/{self.individual_class.pk}/split/",
            {"target_class": str(target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class PaymentAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(name="Programming", slug="programming")
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
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
        response = self.client.get(f"{self.base_url}/payments/list/")
        self.assertEqual(response.status_code, 200)

    def test_record_payment_as_secretary(self):
        self.authenticate_as_secretary()
        response = self.client.post(
            f"{self.base_url}/payments/",
            {
                "enrollment": str(self.enrollment.pk),
                "amount": "500.00",
                "payment_method": "CASH",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], PaymentStatus.PAID)

    def test_record_payment_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/payments/",
            {
                "enrollment": str(self.enrollment.pk),
                "amount": "500.00",
                "payment_method": "CASH",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_verification_queue_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.get(f"{self.base_url}/payments/verification-queue/")
        self.assertEqual(response.status_code, 200)

    def test_under_review_as_secretary(self):
        self.authenticate_as_secretary()
        self.enrollment.verification_status = VerificationStatus.SUBMITTED
        self.enrollment.save()
        response = self.client.post(
            f"{self.base_url}/payments/{self.enrollment.pk}/under-review/",
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_reject_enrollment(self):
        self.authenticate_as_secretary()
        self.enrollment.verification_status = VerificationStatus.SUBMITTED
        self.enrollment.save()
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment, amount=Decimal("500.00"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="TXN-REJ", status=PaymentStatus.PENDING,
        )
        response = self.client.post(
            f"{self.base_url}/payments/{self.enrollment.pk}/reject/",
            {"rejection_reason": "Payment not found."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)


class AttendanceAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()

        self.program = Program.objects.create(name="Att Program", slug="att-program")
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Att Sub", slug="att-sub", group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
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


class ProgressAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = Program.objects.create(
            name="Prog Program", slug="prog-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Prog Sub", slug="prog-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="API Prog Class",
            class_type=ClassType.INDIVIDUAL,
        )
        self.student_user = user_service.create_student_user(
            "api-prog-student@test.com", "API", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )

    def test_create_shared_milestone_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/learning-milestones/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Variables",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())
        self.assertEqual(response.json()["scope"], "shared")

    def test_create_class_milestone_as_instructor(self):
        self._authenticate(self.instructor)
        response = self.client.post(
            f"{self.base_url}/learning-milestones/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Class Topic",
                "scope_class": str(self.klass.pk),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["scope"], "class_specific")

    def test_instructor_cannot_create_shared_milestone(self):
        self._authenticate(self.instructor)
        response = self.client.post(
            f"{self.base_url}/learning-milestones/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Should Fail",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_milestone_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(
            f"{self.base_url}/learning-milestones/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Variables",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_milestones(self):
        self.authenticate_as_super_admin()
        progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Loops", scope_class=None,
        )
        response = self.client.get(
            f"{self.base_url}/learning-milestones/?sub_program={self.sub_program.pk}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_list_milestones_with_scope_class(self):
        self.authenticate_as_super_admin()
        progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Shared", scope_class=None,
        )
        progress_service.create_milestone(
            actor=self.instructor, sub_program=self.sub_program,
            title="Class Only", scope_class=self.klass,
        )
        response = self.client.get(
            f"{self.base_url}/learning-milestones/"
            f"?sub_program={self.sub_program.pk}&scope_class={self.klass.pk}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_retrieve_milestone(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Functions", scope_class=None,
        )
        response = self.client.get(
            f"{self.base_url}/learning-milestones/{milestone.pk}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Functions")

    def test_update_milestone(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Old Title", scope_class=None,
        )
        response = self.client.patch(
            f"{self.base_url}/learning-milestones/{milestone.pk}/",
            {"title": "New Title"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "New Title")

    def test_archive_milestone(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="To Archive", scope_class=None,
        )
        response = self.client.post(
            f"{self.base_url}/learning-milestones/{milestone.pk}/archive/",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["is_active"])

    def test_customize_milestone(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="To Customize", scope_class=None,
        )
        response = self.client.post(
            f"{self.base_url}/learning-milestones/{milestone.pk}/customize/",
            {"target_class": str(self.klass.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["scope"], "class_specific")

    def test_record_progress(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Track Me", scope_class=None,
        )
        response = self.client.post(
            f"{self.base_url}/student-progress/",
            {
                "enrollment": str(self.enrollment.pk),
                "milestone": str(milestone.pk),
                "status": ProgressStatus.COMPLETED,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], ProgressStatus.COMPLETED)

    def test_record_progress_unauthenticated_returns_401(self):
        self.client.credentials()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Track Me 2", scope_class=None,
        )
        response = self.client.post(
            f"{self.base_url}/student-progress/",
            {
                "enrollment": str(self.enrollment.pk),
                "milestone": str(milestone.pk),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_update_progress(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Update Me", scope_class=None,
        )
        record = progress_service.record_progress(
            actor=self.instructor, enrollment=self.enrollment,
            milestone=milestone, status=ProgressStatus.NOT_STARTED,
        )
        response = self.client.patch(
            f"{self.base_url}/student-progress/{record.pk}/",
            {"status": ProgressStatus.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], ProgressStatus.IN_PROGRESS)

    def test_progress_history(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="History Test", scope_class=None,
        )
        progress_service.record_progress(
            actor=self.instructor, enrollment=self.enrollment,
            milestone=milestone, status=ProgressStatus.COMPLETED,
        )
        response = self.client.get(
            f"{self.base_url}/student-progress/enrollments/{self.enrollment.pk}/history/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_progress_summary(self):
        self.authenticate_as_super_admin()
        milestone = progress_service.create_milestone(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Summary Test", scope_class=None,
        )
        progress_service.record_progress(
            actor=self.instructor, enrollment=self.enrollment,
            milestone=milestone, status=ProgressStatus.COMPLETED,
        )
        response = self.client.get(
            f"{self.base_url}/student-progress/enrollments/{self.enrollment.pk}/summary/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["completed"], 1)

    def test_instructor_cannot_access_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.get(
            f"{self.base_url}/learning-milestones/"
        )
        self.assertEqual(response.status_code, 403)


class LearningMaterialAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = Program.objects.create(
            name="Mat API Program", slug="mat-api-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Mat API Sub", slug="mat-api-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="API Mat Class",
            class_type=ClassType.INDIVIDUAL,
        )
        self.student_user = user_service.create_student_user(
            "api-mat-student@test.com", "API", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )

    def _create_temp_file(self, name="test.pdf"):
        from io import BytesIO
        from django.core.files.base import ContentFile
        from PIL import Image
        ext = os.path.splitext(name)[1].lower()
        if ext == ".pdf":
            content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
        elif ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            buf = BytesIO()
            img = Image.new("RGB", (1, 1), color="red")
            if ext in (".jpg", ".jpeg"):
                img.save(buf, format="JPEG")
            elif ext == ".png":
                img.save(buf, format="PNG")
            elif ext == ".gif":
                img.save(buf, format="GIF")
            elif ext == ".webp":
                img.save(buf, format="WebP")
            content = buf.getvalue()
        elif ext == ".docx":
            content = b"PK\x03\x04" + b"\x00" * 30
        else:
            content = b"test content"
        return ContentFile(content, name=name)

    def test_upload_as_super_admin(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        response = self.client.post(
            f"{self.base_url}/learning-materials/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "API Upload",
                "file": file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())
        self.assertEqual(response.json()["material_type"], "PDF")

    def test_upload_as_instructor(self):
        self._authenticate(self.instructor)
        file = self._create_temp_file()
        response = self.client.post(
            f"{self.base_url}/learning-materials/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Instructor Upload",
                "file": file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)

    def test_upload_unauthenticated_returns_401(self):
        self.client.credentials()
        file = self._create_temp_file()
        response = self.client.post(
            f"{self.base_url}/learning-materials/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "No Auth",
                "file": file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 401)

    def test_upload_as_student_returns_403(self):
        self.authenticate_as_student()
        file = self._create_temp_file()
        response = self.client.post(
            f"{self.base_url}/learning-materials/",
            {
                "sub_program": str(self.sub_program.pk),
                "title": "Student Upload",
                "file": file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_materials(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="List Test", file=file,
        )
        response = self.client.get(
            f"{self.base_url}/learning-materials/"
            f"?sub_program={self.sub_program.pk}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_retrieve_material(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Retrieve Test", file=file,
        )
        response = self.client.get(
            f"{self.base_url}/learning-materials/{material.pk}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Retrieve Test")

    def test_update_material(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Update Title", file=file,
        )
        response = self.client.patch(
            f"{self.base_url}/learning-materials/{material.pk}/",
            {"title": "Updated"},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Updated")

    def test_update_material_replaces_file(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="File Replace", file=file,
        )
        png_file = self._create_temp_file(name="new_image.png")
        response = self.client.patch(
            f"{self.base_url}/learning-materials/{material.pk}/",
            {"file": png_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["material_type"], "IMAGE")

    def test_delete_material(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Delete Test", file=file,
        )
        response = self.client.post(
            f"{self.base_url}/learning-materials/{material.pk}/delete/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["is_active"])

    def test_download_material(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Download Test", file=file,
        )
        response = self.client.get(
            f"{self.base_url}/learning-materials/{material.pk}/download/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            response["Content-Disposition"].endswith('.pdf"'),
        )

    def test_download_deleted_material_returns_404(self):
        self.authenticate_as_super_admin()
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Gone", file=file,
        )
        learning_material_service.delete_material(self.super_admin, material)
        response = self.client.get(
            f"{self.base_url}/learning-materials/{material.pk}/download/"
        )
        self.assertEqual(response.status_code, 404)

    def test_student_can_view_enrolled_sub_program_materials(self):
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.super_admin, sub_program=self.sub_program,
            title="Student Visible", file=file,
        )
        self._authenticate(self.student_user)
        response = self.client.get(
            f"{self.base_url}/learning-materials/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_student_cannot_view_unenrolled_sub_program_materials(self):
        other_program = Program.objects.create(
            name="Other API", slug="other-api",
        )
        other_sub = SubProgram.objects.create(
            program=other_program, name="Other API Sub", slug="other-api-sub",
            group_fee=Decimal("400.00"), individual_fee=Decimal("400.00"),
        )
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.super_admin, sub_program=other_sub,
            title="Hidden From Student", file=file,
        )
        self._authenticate(self.student_user)
        response = self.client.get(
            f"{self.base_url}/learning-materials/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 0)


class CertificateAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = Program.objects.create(
            name="Cert API Program", slug="cert-api-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Cert API Sub", slug="cert-api-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="API Cert Class",
            class_type=ClassType.INDIVIDUAL,
        )
        self.student_user = user_service.create_student_user(
            "api-cert-student@test.com", "API", "CertStudent",
            self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )
        from django.core.files.base import ContentFile
        from io import BytesIO
        from PIL import Image
        buf = BytesIO()
        Image.new("RGB", (100, 50), color="blue").save(buf, format="PNG")
        self.bg_file = ContentFile(buf.getvalue(), name="bg.png")

    def _create_template_payload(self, **overrides):
        data = {
            "sub_program": str(self.sub_program.pk),
            "title": "API Certificate",
            "background": self.bg_file,
            "body_text": "Body text here",
        }
        data.update(overrides)
        return data

    def _issue_payload(self, certificate):
        return {
            "student": str(self.student_model.pk),
            "certificate": str(certificate.pk),
        }

    def test_create_template_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_template_as_secretary(self):
        secretary = self.authenticate_as_secretary()
        response = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_template_as_instructor_returns_403(self):
        self._authenticate(self.instructor)
        response = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_templates(self):
        self.authenticate_as_super_admin()
        self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        response = self.client.get(f"{self.base_url}/certificate-templates/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_activate_deactivate_template(self):
        self.authenticate_as_super_admin()
        create_resp = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        pk = create_resp.json()["id"]

        deact = self.client.post(
            f"{self.base_url}/certificate-templates/{pk}/deactivate/"
        )
        self.assertEqual(deact.status_code, 200)
        self.assertFalse(deact.json()["is_active"])

        act = self.client.post(
            f"{self.base_url}/certificate-templates/{pk}/activate/"
        )
        self.assertEqual(act.status_code, 200)
        self.assertTrue(act.json()["is_active"])

    def test_issue_certificate_as_manager(self):
        self.authenticate_as_super_admin()
        cert_resp = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        cert_pk = cert_resp.json()["id"]
        certificate = Certificate.objects.get(pk=cert_pk)

        mgr = self.authenticate_as_branch_manager()
        response = self.client.post(
            f"{self.base_url}/student-certificates/issue/",
            self._issue_payload(certificate=certificate),
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("certificate_number", response.json())

    def test_issue_certificate_as_student_returns_403(self):
        self.authenticate_as_super_admin()
        cert_resp = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        cert_pk = cert_resp.json()["id"]
        certificate = Certificate.objects.get(pk=cert_pk)
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/student-certificates/issue/",
            self._issue_payload(certificate=certificate),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_verify_certificate_public(self):
        self.authenticate_as_super_admin()
        cert_resp = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        cert_pk = cert_resp.json()["id"]
        certificate = Certificate.objects.get(pk=cert_pk)
        issue_resp = self.client.post(
            f"{self.base_url}/student-certificates/issue/",
            self._issue_payload(certificate=certificate),
            format="json",
        )
        number = issue_resp.json()["certificate_number"]

        self.client.credentials()
        response = self.client.get(
            f"{self.base_url}/certificates/verify/{number}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_verify_certificate_not_found(self):
        response = self.client.get(
            f"{self.base_url}/certificates/verify/NONEXISTENT/"
        )
        self.assertEqual(response.status_code, 404)

    def test_list_student_certificates(self):
        self.authenticate_as_super_admin()
        cert_resp = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        cert_pk = cert_resp.json()["id"]
        certificate = Certificate.objects.get(pk=cert_pk)
        self.client.post(
            f"{self.base_url}/student-certificates/issue/",
            self._issue_payload(certificate=certificate),
            format="json",
        )
        self._authenticate(self.student_user)
        response = self.client.get(f"{self.base_url}/student-certificates/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_unauthenticated_returns_401_for_protected(self):
        response = self.client.post(
            f"{self.base_url}/certificate-templates/",
            self._create_template_payload(),
            format="multipart",
        )
        self.assertEqual(response.status_code, 401)


class ReportAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Report Prog", slug="report-prog",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Report Sub", slug="report-sub",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        self.class_model = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Report Class",
            class_type=ClassType.GROUP, capacity=10,
        )
        self.student_user = user_service.create_student_user(
            "repapi@test.com", "Report", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_user.is_email_verified = True
        self.student_user.save()
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )

    # -- Permission tests for student reports --

    def test_student_academic_report_unauthenticated_returns_401(self):
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/academic/"
        )
        self.assertEqual(response.status_code, 401)

    def test_student_academic_report_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/academic/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("Content-Disposition", response)

    def test_student_academic_report_as_student_self(self):
        self._authenticate(self.student_user)
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/academic/"
        )
        self.assertEqual(response.status_code, 200)

    def test_student_academic_report_as_other_student_returns_403(self):
        other_user = user_service.create_student_user(
            "other@test.com", "Other", "Student", self.password, self.branch,
        )
        user_service.activate_user(other_user)
        other_user.is_email_verified = True
        other_user.save()
        self._authenticate(other_user)
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/academic/"
        )
        self.assertEqual(response.status_code, 403)

    def test_enrollment_report_as_branch_manager(self):
        self.authenticate_as_branch_manager()
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/enrollments/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_attendance_report_as_secretary(self):
        self.authenticate_as_secretary()
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/attendance/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_progress_report(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/progress/"
        )
        self.assertEqual(response.status_code, 200)

    def test_certificate_report(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/reports/students/{self.student_model.pk}/certificates/"
        )
        self.assertEqual(response.status_code, 200)

    # -- Staff reports permission tests --

    def test_class_report_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.get(
            f"{self.base_url}/reports/classes/{self.class_model.pk}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_class_report_as_instructor(self):
        self._authenticate(self.instructor)
        response = self.client.get(
            f"{self.base_url}/reports/classes/{self.class_model.pk}/"
        )
        self.assertEqual(response.status_code, 200)

    def test_sub_program_report_as_branch_manager(self):
        self.authenticate_as_branch_manager()
        response = self.client.get(
            f"{self.base_url}/reports/sub-programs/{self.sub_program.pk}/"
        )
        self.assertEqual(response.status_code, 200)

    def test_program_report_as_secretary(self):
        self.authenticate_as_secretary()
        response = self.client.get(
            f"{self.base_url}/reports/programs/{self.program.pk}/"
        )
        self.assertEqual(response.status_code, 200)

    def test_class_report_unauthenticated_returns_401(self):
        response = self.client.get(
            f"{self.base_url}/reports/classes/{self.class_model.pk}/"
        )
        self.assertEqual(response.status_code, 401)


class TransferAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.branch_a = Branch.objects.create(name="Branch A", code="BA01")
        self.branch_b = Branch.objects.create(name="Branch B", code="BB01")
        self.program = program_service.create_program(
            name="Programming", slug="programming",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "transferee@test.com", "Test", "Student", self.password, self.branch_a,
        )
        user_service.activate_user(self.student_user)
        self.student_user.is_email_verified = True
        self.student_user.save()
        self.student = Student.objects.create(
            user=self.student_user, branch=self.branch_a, date_joined=date.today(),
        )
        self.source_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch_a, instructor=self.instructor,
            name="Source", class_type=ClassType.INDIVIDUAL,
        )
        self.target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch_b, instructor=self.instructor,
            name="Target", class_type=ClassType.INDIVIDUAL,
        )
        self.enrollment = enroll_student(
            None, student=self.student, enrolled_class=self.source_class,
        )
        self.enrollment.status = EnrollmentStatus.ACTIVE
        self.enrollment.save()

    def test_request_transfer_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/transfers/request/",
            {
                "enrollment": str(self.enrollment.pk),
                "target_class": str(self.target_class.pk),
                "to_branch": str(self.branch_b.pk),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "PENDING")

    def test_request_transfer_unauthenticated_returns_401(self):
        response = self.client.post(
            f"{self.base_url}/transfers/request/",
            {
                "enrollment": str(self.enrollment.pk),
                "target_class": str(self.target_class.pk),
                "to_branch": str(self.branch_b.pk),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_request_transfer_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/transfers/request/",
            {
                "enrollment": str(self.enrollment.pk),
                "target_class": str(self.target_class.pk),
                "to_branch": str(self.branch_b.pk),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_transfers_as_super_admin(self):
        self.authenticate_as_super_admin()
        request_transfer(
            self.super_admin,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        response = self.client.get(f"{self.base_url}/transfers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_list_transfers_unauthenticated_returns_401(self):
        response = self.client.get(f"{self.base_url}/transfers/")
        self.assertEqual(response.status_code, 401)

    def test_approve_transfer_as_super_admin(self):
        self.authenticate_as_super_admin()
        transfer = request_transfer(
            self.super_admin,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        response = self.client.post(
            f"{self.base_url}/transfers/{transfer.pk}/approve/",
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["new_enrollment"]["status"], EnrollmentStatus.ACTIVE)
        self.assertEqual(data["transfer_request"]["status"], "APPROVED")

    def test_reject_transfer_as_super_admin(self):
        self.authenticate_as_super_admin()
        transfer = request_transfer(
            self.super_admin,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        response = self.client.post(
            f"{self.base_url}/transfers/{transfer.pk}/reject/",
            {"rejection_reason": "No capacity"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "REJECTED")


class SwitchSubProgramAPITest(AcademicAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = program_service.create_program(
            name="Programming", slug="programming",
            supports_group=True, supports_individual=True,
        )
        self.sub_program_a = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        self.sub_program_b = program_service.create_sub_program(
            program=self.program, name="Java", slug="java",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "switchit@test.com", "Switch", "Student", self.password, self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_user.is_email_verified = True
        self.student_user.save()
        self.student = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.current_class = class_service.create_class(
            sub_program=self.sub_program_a, branch=self.branch, instructor=self.instructor,
            name="Python Class", class_type=ClassType.INDIVIDUAL,
        )
        self.target_class = class_service.create_class(
            sub_program=self.sub_program_b, branch=self.branch, instructor=self.instructor,
            name="Java Class", class_type=ClassType.INDIVIDUAL,
        )
        self.enrollment = enroll_student(
            None, student=self.student, enrolled_class=self.current_class,
        )
        self.enrollment.status = EnrollmentStatus.ACTIVE
        self.enrollment.save()

    def test_switch_subprogram_as_super_admin(self):
        self.authenticate_as_super_admin()
        response = self.client.post(
            f"{self.base_url}/enrollments/{self.enrollment.pk}/switch-subprogram/",
            {"target_class": str(self.target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["new_enrollment"]["status"], EnrollmentStatus.ACTIVE)
        self.assertIsNotNone(data["new_enrollment"]["enrollment_number"])
        self.assertEqual(data["amount_due"], 200.0)

    def test_switch_subprogram_unauthenticated_returns_401(self):
        response = self.client.post(
            f"{self.base_url}/enrollments/{self.enrollment.pk}/switch-subprogram/",
            {"target_class": str(self.target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_switch_subprogram_as_student_returns_403(self):
        self.authenticate_as_student()
        response = self.client.post(
            f"{self.base_url}/enrollments/{self.enrollment.pk}/switch-subprogram/",
            {"target_class": str(self.target_class.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 403)