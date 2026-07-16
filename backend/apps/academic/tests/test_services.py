import os
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase, override_settings

from apps.academic.constants import (
    ClassType, ClassPeriod, AttendanceStatus, SessionStatus,
    EnrollmentStatus, PaymentMethod, PaymentStatus, VerificationStatus,
    ProgressStatus, MaterialType,
)
from apps.academic.models import (
    BranchTransferRequest, Program, SubProgram, Class, Student, EnrollmentPeriod,
    StaffAttendanceSession, StaffAttendanceRecord, Enrollment, EnrollmentPayment,
    AttendanceSession, AttendanceRecord, LearningMilestone, StudentProgress,
)
from apps.academic.services import program_service, class_service, admission_service, student_service, attendance_service
from apps.academic.services import progress_service
from apps.academic.services import learning_material_service
from apps.academic.services.enrollment_period_service import (
    create_enrollment_period,
    get_enrollment_period_or_404,
    list_enrollment_periods,
    update_enrollment_period,
    activate_enrollment_period,
    deactivate_enrollment_period,
)
from apps.academic.services.staff_attendance_service import (
    create_session,
    get_session_or_404,
    list_sessions,
    update_session,
    publish_session,
    soft_delete_session,
    upsert_records,
    update_record,
    delete_record,
    list_available_staff,
)
from apps.academic.services.enrollment_service import (
    enroll_student,
    cancel_enrollment,
    complete_enrollment,
    get_enrollment_or_404,
    list_enrollments,
)
from apps.academic.services.payment_service import (
    record_payment,
    reject_payment,
    set_under_review,
    list_payments,
    get_payment_or_404,
)
from apps.academic.services.enrollment_service import (
    get_all_related_enrollments,
    move_enrollment,
    bulk_move_enrollments,
    switch_subprogram,
)
from apps.academic.services.transfer_service import (
    approve_transfer,
    list_transfer_requests,
    reject_transfer,
    request_transfer,
)
from apps.accounts.models import Branch, User, UserAssignment
from apps.accounts.constants import Roles
from apps.accounts.services import user_service


class ProgramServiceTest(TestCase):
    def setUp(self):
        self.program = program_service.create_program(
            name="Programming",
            slug="programming",
            description="Learn programming",
            supports_group=True,
            supports_individual=True,
        )

    def test_create_program(self):
        self.assertEqual(self.program.name, "Programming")
        self.assertEqual(self.program.slug, "programming")
        self.assertTrue(self.program.is_active)
        self.assertTrue(self.program.supports_group)
        self.assertTrue(self.program.supports_individual)

    def test_create_program_requires_at_least_one_learning_type(self):
        with self.assertRaises(DjangoValidationError):
            program_service.create_program(
                name="Invalid",
                slug="invalid",
                supports_group=False,
                supports_individual=False,
            )

    def test_list_programs(self):
        program_service.create_program(name="Robotics", slug="robotics")
        programs = program_service.list_programs()
        self.assertEqual(programs.count(), 2)

    def test_get_program_or_404(self):
        result = program_service.get_program_or_404(self.program.pk)
        self.assertEqual(result.pk, self.program.pk)

    def test_update_program(self):
        updated = program_service.update_program(self.program, name="Advanced Programming")
        self.assertEqual(updated.name, "Advanced Programming")

    def test_activate_deactivate_program(self):
        program_service.deactivate_program(self.program)
        self.program.refresh_from_db()
        self.assertFalse(self.program.is_active)

        program_service.activate_program(self.program)
        self.program.refresh_from_db()
        self.assertTrue(self.program.is_active)


class SubProgramServiceTest(TestCase):
    def setUp(self):
        self.program = program_service.create_program(
            name="Programming",
            slug="programming",
        )

    def test_create_sub_program(self):
        sub = program_service.create_sub_program(
            program=self.program,
            name="Python",
            slug="python",
            group_fee=500.00, individual_fee=500.00,
        )
        self.assertEqual(sub.name, "Python")
        self.assertEqual(sub.program, self.program)
        self.assertEqual(sub.group_fee, 500.00)
        self.assertTrue(sub.is_active)

    def test_create_sub_program_with_duration(self):
        sub = program_service.create_sub_program(
            program=self.program,
            name="Scratch",
            slug="scratch",
            group_fee=300.00, individual_fee=300.00,
            duration=12,
            duration_unit="WEEK",
        )
        self.assertEqual(sub.duration, 12)
        self.assertEqual(sub.duration_unit, "WEEK")

    def test_invalid_duration_unit(self):
        with self.assertRaises(DjangoValidationError):
            program_service.create_sub_program(
                program=self.program,
                name="Invalid",
                slug="invalid",
                group_fee=100.00, individual_fee=100.00,
                duration_unit="YEAR",
            )

    def test_duplicate_sub_program_name_in_same_program(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        with self.assertRaises(Exception):
            program_service.create_sub_program(
                program=self.program, name="Python", slug="python-2", group_fee=500.00, individual_fee=500.00
            )

    def test_list_sub_programs(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        program_service.create_sub_program(
            program=self.program, name="Java", slug="java", group_fee=600.00, individual_fee=600.00
        )
        subs = program_service.list_sub_programs()
        self.assertEqual(subs.count(), 2)

    def test_update_sub_program(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        updated = program_service.update_sub_program(sub, name="Advanced Python", group_fee=700.00, individual_fee=700.00)
        self.assertEqual(updated.name, "Advanced Python")
        self.assertEqual(updated.group_fee, 700.00)

    def test_activate_deactivate_sub_program(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        program_service.deactivate_sub_program(sub)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

        program_service.activate_sub_program(sub)
        sub.refresh_from_db()
        self.assertTrue(sub.is_active)

    def test_create_sub_program_negative_fee_raises_error(self):
        with self.assertRaises(DjangoValidationError):
            program_service.create_sub_program(
                program=self.program,
                name="Bad",
                slug="bad",
                group_fee=-100.00, individual_fee=-100.00,
            )

    def test_update_sub_program_negative_fee_raises_error(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )
        with self.assertRaises(DjangoValidationError):
            program_service.update_sub_program(sub, group_fee=-50.00, individual_fee=-50.00)


class ClassServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.instructor = user_service.create_staff_user(
            "instructor@test.com",
            "John",
            "Doe",
            "StrongP@ssw0rd!2026",
            branch=self.branch,
        )
        self.program = program_service.create_program(
            name="Programming", slug="programming"
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", group_fee=500.00, individual_fee=500.00
        )

    def test_create_group_class(self):
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        self.assertEqual(klass.name, "Python Group A")
        self.assertEqual(klass.class_type, ClassType.GROUP)
        self.assertEqual(klass.capacity, 20)
        self.assertTrue(klass.is_active)

    def test_create_group_class_requires_capacity(self):
        with self.assertRaises(DjangoValidationError):
            class_service.create_class(
                sub_program=self.sub_program,
                branch=self.branch,
                instructor=self.instructor,
                name="Python Group No Capacity",
                class_type=ClassType.GROUP,
            )

    def test_create_individual_class_sets_capacity_to_one(self):
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Individual",
            class_type=ClassType.INDIVIDUAL,
        )
        self.assertEqual(klass.capacity, 1)

    def test_list_classes(self):
        class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group B",
            class_type=ClassType.GROUP,
            capacity=15,
        )
        classes = class_service.list_classes()
        self.assertEqual(classes.count(), 2)

    def test_update_class(self):
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        updated = class_service.update_class(klass, name="Python Group Alpha", capacity=25)
        self.assertEqual(updated.name, "Python Group Alpha")
        self.assertEqual(updated.capacity, 25)

    def test_assign_instructor(self):
        new_instructor = user_service.create_staff_user(
            "new-instructor@test.com",
            "Jane",
            "Doe",
            "StrongP@ssw0rd!2026",
            branch=self.branch,
        )
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        class_service.assign_instructor(klass, new_instructor)
        klass.refresh_from_db()
        self.assertEqual(klass.instructor, new_instructor)

    def test_activate_deactivate_class(self):
        klass = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            capacity=20,
        )
        class_service.deactivate_class(klass)
        klass.refresh_from_db()
        self.assertFalse(klass.is_active)

        class_service.activate_class(klass)
        klass.refresh_from_db()
        self.assertTrue(klass.is_active)


class AdmissionServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")

    def test_admit_student(self):
        student = admission_service.admit_student(
            email="student@test.com",
            first_name="Test",
            last_name="Student",
            password="StrongP@ssw0rd!2026",
            branch=self.branch,
        )
        self.assertIsNotNone(student)
        self.assertEqual(student.user.email, "student@test.com")
        self.assertEqual(student.branch, self.branch)
        self.assertEqual(student.date_joined, date.today())
        self.assertTrue(student.is_active)
        self.assertTrue(Student.objects.filter(pk=student.pk).exists())

    def test_admit_student_with_phone_number(self):
        student = admission_service.admit_student(
            email="student-phone@test.com",
            first_name="Phone",
            last_name="Test",
            password="StrongP@ssw0rd!2026",
            phone_number="+251911223344",
            branch=self.branch,
        )
        student.user.refresh_from_db()
        self.assertEqual(student.user.phone_number, "+251911223344")

    def test_admit_student_with_custom_date(self):
        custom_date = date(2025, 1, 15)
        student = admission_service.admit_student(
            email="student-date@test.com",
            first_name="Date",
            last_name="Test",
            password="StrongP@ssw0rd!2026",
            branch=self.branch,
            date_joined=custom_date,
        )
        self.assertEqual(student.date_joined, custom_date)


class StudentServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.student = admission_service.admit_student(
            email="student-svc@test.com",
            first_name="Service",
            last_name="Test",
            password="StrongP@ssw0rd!2026",
            branch=self.branch,
        )

    def test_get_student_or_404(self):
        result = student_service.get_student_or_404(self.student.pk)
        self.assertEqual(result.pk, self.student.pk)

    def test_update_student_name(self):
        updated = student_service.update_student(
            self.student, first_name="Updated", last_name="Name"
        )
        updated.user.refresh_from_db()
        self.assertEqual(updated.user.first_name, "Updated")
        self.assertEqual(updated.user.last_name, "Name")

    def test_update_student_branch(self):
        new_branch = Branch.objects.create(name="Adama Branch", code="AB01")
        updated = student_service.update_student(self.student, branch=new_branch)
        updated.refresh_from_db()
        self.assertEqual(updated.branch, new_branch)

    def test_search_students_by_name(self):
        results = student_service.search_students("Service")
        self.assertEqual(results.count(), 1)

    def test_search_students_by_email(self):
        results = student_service.search_students("student-svc")
        self.assertEqual(results.count(), 1)

    def test_search_students_no_match(self):
        results = student_service.search_students("nonexistent")
        self.assertEqual(results.count(), 0)

    def test_activate_deactivate_student(self):
        student_service.deactivate_student(self.student)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)

        student_service.activate_student(self.student)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_active)


class EnrollmentPeriodServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
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
            title="Fall 2026 Registration",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )

    def test_create_enrollment_period(self):
        self.assertEqual(self.period.title, "Fall 2026 Registration")
        self.assertEqual(self.period.class_type, ClassType.GROUP)
        self.assertEqual(self.period.branch, self.branch)
        self.assertEqual(self.period.program, self.program)
        self.assertEqual(self.period.sub_program, self.sub_program)
        self.assertTrue(self.period.is_active)

    def test_list_enrollment_periods(self):
        create_enrollment_period(
            actor=None,
            branch=self.branch,
            program=self.program,
            sub_program=self.sub_program,
            class_type=ClassType.INDIVIDUAL,
            class_period=ClassPeriod.FULL_DAY,
            title="Spring 2026",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=15),
        )
        periods = list_enrollment_periods()
        self.assertEqual(periods.count(), 2)

    def test_get_enrollment_period_or_404(self):
        result = get_enrollment_period_or_404(self.period.pk)
        self.assertEqual(result.pk, self.period.pk)

    def test_update_enrollment_period(self):
        updated = update_enrollment_period(None, self.period, title="Winter 2026")
        self.assertEqual(updated.title, "Winter 2026")

    def test_activate_deactivate_enrollment_period(self):
        deactivate_enrollment_period(None, self.period)
        self.period.refresh_from_db()
        self.assertFalse(self.period.is_active)

        activate_enrollment_period(None, self.period)
        self.period.refresh_from_db()
        self.assertTrue(self.period.is_active)

    def test_start_date_before_end_date_validation(self):
        with self.assertRaises(DjangoValidationError):
            create_enrollment_period(
                actor=None,
                branch=self.branch,
                program=self.program,
                sub_program=self.sub_program,
                class_type=ClassType.GROUP,
                class_period=ClassPeriod.FULL_DAY,
                title="Invalid Period",
                start_date=date.today() + timedelta(days=10),
                end_date=date.today(),
            )


class StaffAttendanceServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.manager = user_service.create_staff_user(
            "manager@test.com", "Branch", "Manager", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.BRANCH_MANAGER,
        )
        self.instructor = user_service.create_staff_user(
            "instructor@test.com", "John", "Doe", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.session = create_session(
            branch=self.branch,
            date=date.today(),
            created_by=self.manager,
        )

    def test_create_session_defaults_to_draft(self):
        self.assertEqual(self.session.status, SessionStatus.DRAFT)
        self.assertTrue(self.session.is_active)

    def test_upsert_records_creates_and_updates(self):
        records = upsert_records(self.manager, self.session, [
            {"staff_member": self.instructor, "status": AttendanceStatus.PRESENT},
        ])
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].status, AttendanceStatus.PRESENT)

        records = upsert_records(self.manager, self.session, [
            {"staff_member": self.instructor, "status": AttendanceStatus.LATE},
        ])
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].status, AttendanceStatus.LATE)

    def test_upsert_records_raises_after_publish(self):
        publish_session(self.manager, self.session)
        with self.assertRaises(DjangoValidationError):
            upsert_records(self.manager, self.session, [
                {"staff_member": self.instructor, "status": AttendanceStatus.PRESENT},
            ])

    def test_publish_session_flips_status(self):
        publish_session(self.manager, self.session)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, SessionStatus.PUBLISHED)

    def test_publish_already_published_raises(self):
        publish_session(self.manager, self.session)
        with self.assertRaises(DjangoValidationError):
            publish_session(self.manager, self.session)

    def test_update_session_draft_only(self):
        updated = update_session(self.manager, self.session, notes="Updated notes")
        self.assertEqual(updated.notes, "Updated notes")

    def test_update_session_raises_after_publish(self):
        publish_session(self.manager, self.session)
        with self.assertRaises(DjangoValidationError):
            update_session(self.manager, self.session, notes="Trying to update")

    def test_update_record_draft_only(self):
        records = upsert_records(self.manager, self.session, [
            {"staff_member": self.instructor, "status": AttendanceStatus.PRESENT},
        ])
        updated = update_record(self.manager, records[0], status=AttendanceStatus.ABSENT)
        self.assertEqual(updated.status, AttendanceStatus.ABSENT)

    def test_delete_record_draft_only(self):
        records = upsert_records(self.manager, self.session, [
            {"staff_member": self.instructor, "status": AttendanceStatus.PRESENT},
        ])
        record = records[0]
        record_id = record.pk
        delete_record(self.manager, record)
        self.assertFalse(StaffAttendanceRecord.objects.filter(pk=record_id).exists())

    def test_soft_delete_session(self):
        soft_delete_session(self.manager, self.session)
        self.session.refresh_from_db()
        self.assertFalse(self.session.is_active)

    def test_list_sessions(self):
        create_session(branch=self.branch, date=date.today() + timedelta(days=1), created_by=self.manager)
        sessions = list_sessions()
        self.assertEqual(sessions.count(), 2)

    def test_list_sessions_filters_by_branch(self):
        other_branch = Branch.objects.create(name="Other", code="OB01")
        create_session(branch=other_branch, date=date.today(), created_by=self.manager)
        sessions = list_sessions(branch=self.branch)
        self.assertEqual(sessions.count(), 1)

    def test_list_available_staff_excludes_students(self):
        user_service.create_student_user(
            "student@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        staff = list_available_staff(self.branch)
        self.assertIn(self.instructor, staff)
        for s in staff:
            self.assertNotEqual(
                UserAssignment.objects.filter(user=s, role=Roles.STUDENT).first() is not None,
                True,
            )

    def test_list_sessions_excludes_soft_deleted(self):
        session2 = create_session(
            branch=self.branch, date=date.today(), created_by=self.manager,
        )
        soft_delete_session(self.manager, session2)
        sessions = list_sessions()
        self.assertEqual(sessions.count(), 1)

    def test_get_session_or_404_raises_for_soft_deleted(self):
        soft_delete_session(self.manager, self.session)
        with self.assertRaises(Exception):
            get_session_or_404(self.session.pk)


class EnrollmentServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = program_service.create_program(
            name="Programming", slug="programming", supports_group=True, supports_individual=True,
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "student@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_user.is_email_verified = True
        self.student_user.save()
        self.student = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )

        self.instructor = user_service.create_staff_user(
            "instructor@test.com", "John", "Doe", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.group_class = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Group A",
            class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY,
            capacity=20,
        )
        self.individual_class = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Python Individual",
            class_type=ClassType.INDIVIDUAL,
        )

        self.enrollment_period = create_enrollment_period(
            actor=None,
            branch=self.branch,
            program=self.program,
            sub_program=self.sub_program,
            class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY,
            title="Fall 2026",
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() + timedelta(days=30),
        )

    def test_enroll_student_individual(self):
        enrollment = enroll_student(
            actor=self.instructor,
            student=self.student,
            enrolled_class=self.individual_class,
        )
        self.assertEqual(enrollment.student, self.student)
        self.assertEqual(enrollment.enrolled_class, self.individual_class)
        self.assertEqual(enrollment.status, EnrollmentStatus.PENDING_VERIFICATION)

    def test_enroll_student_group_with_active_period(self):
        enrollment = enroll_student(
            actor=self.instructor,
            student=self.student,
            enrolled_class=self.group_class,
        )
        self.assertEqual(enrollment.status, EnrollmentStatus.PENDING_VERIFICATION)

    def test_enroll_student_group_without_period_raises(self):
        deactivate_enrollment_period(None, self.enrollment_period)
        with self.assertRaises(DjangoValidationError) as ctx:
            enroll_student(
                actor=self.instructor,
                student=self.student,
                enrolled_class=self.group_class,
            )
        self.assertIn("active enrollment period", str(ctx.exception).lower())

    def test_enroll_duplicate_raises(self):
        enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        with self.assertRaises(DjangoValidationError) as ctx:
            enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        self.assertIn("already enrolled", str(ctx.exception).lower())

    def test_enroll_class_at_capacity_raises(self):
        other_student_user = user_service.create_student_user(
            "other@test.com", "Other", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(other_student_user)
        other_student, _ = Student.objects.get_or_create(
            user=other_student_user, defaults={"branch": self.branch, "date_joined": date.today()},
        )

        capacity_class = class_service.create_class(
            sub_program=self.sub_program,
            branch=self.branch,
            instructor=self.instructor,
            name="Limited Class",
            class_type=ClassType.GROUP,
            capacity=1,
        )
        ep = create_enrollment_period(
            actor=None, branch=self.branch, program=self.program,
            sub_program=self.sub_program, class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY, title="Period",
            start_date=date.today() - timedelta(days=1),
            end_date=date.today() + timedelta(days=1),
        )
        enroll_student(actor=self.instructor, student=self.student, enrolled_class=capacity_class)
        with self.assertRaises(DjangoValidationError) as ctx:
            enroll_student(actor=self.instructor, student=other_student, enrolled_class=capacity_class)
        self.assertIn("capacity", str(ctx.exception).lower())

    def test_cancel_pending_enrollment(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        cancel_enrollment(self.instructor, enrollment)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EnrollmentStatus.CANCELLED)

    def test_cancel_completed_enrollment_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.save()
        with self.assertRaises(DjangoValidationError):
            cancel_enrollment(self.instructor, enrollment)

    def test_complete_active_enrollment(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()
        complete_enrollment(self.instructor, enrollment)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)

    def test_complete_pending_enrollment_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        with self.assertRaises(DjangoValidationError):
            complete_enrollment(self.instructor, enrollment)

    def test_get_enrollment_or_404(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        result = get_enrollment_or_404(enrollment.pk)
        self.assertEqual(result.pk, enrollment.pk)

    def test_list_enrollments(self):
        enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        self.assertEqual(list_enrollments().count(), 1)

    def test_move_enrollment_success(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Target Class", class_type=ClassType.INDIVIDUAL,
        )
        moved = move_enrollment(self.instructor, enrollment=enrollment, target_class=target_class)
        moved.refresh_from_db()
        self.assertEqual(moved.enrolled_class.pk, target_class.pk)

    def test_move_enrollment_non_active_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Target", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            move_enrollment(self.instructor, enrollment=enrollment, target_class=target_class)

    def test_move_enrollment_inactive_target_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Inactive Target", class_type=ClassType.INDIVIDUAL,
        )
        class_service.deactivate_class(target_class)
        with self.assertRaises(DjangoValidationError):
            move_enrollment(self.instructor, enrollment=enrollment, target_class=target_class)

    def test_move_enrollment_different_branch_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        other_branch = Branch.objects.create(name="Other", code="OB02")
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=other_branch, instructor=self.instructor,
            name="Other Branch Class", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            move_enrollment(self.instructor, enrollment=enrollment, target_class=target_class)

    def test_move_enrollment_to_full_group_class_raises(self):
        other_user = user_service.create_student_user(
            "othermove@test.com", "Other", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(other_user)
        other_student = Student.objects.create(
            user=other_user, branch=self.branch, date_joined=date.today(),
        )

        full_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Full Group", class_type=ClassType.GROUP, capacity=1,
        )
        ep = create_enrollment_period(
            actor=None, branch=self.branch, program=self.program,
            sub_program=self.sub_program, class_type=ClassType.GROUP,
            class_period=ClassPeriod.FULL_DAY, title="Move Period",
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() + timedelta(days=30),
        )
        filler = enroll_student(
            actor=self.instructor, student=other_student, enrolled_class=full_class,
        )
        filler.status = EnrollmentStatus.ACTIVE
        filler.save()

        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        with self.assertRaises(DjangoValidationError):
            move_enrollment(self.instructor, enrollment=enrollment, target_class=full_class)

    def test_move_enrollment_duplicate_in_target_raises(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Target Dup", class_type=ClassType.INDIVIDUAL,
        )
        duplicate_enrollment = Enrollment.objects.create(
            student=self.student, enrolled_class=target_class,
            status=EnrollmentStatus.ACTIVE,
        )

        with self.assertRaises(DjangoValidationError):
            move_enrollment(self.instructor, enrollment=enrollment, target_class=target_class)

    def test_bulk_move_enrollments_by_ids(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk Target", class_type=ClassType.INDIVIDUAL,
        )
        moved = bulk_move_enrollments(
            self.instructor, source_class=self.individual_class,
            target_class=target_class, enrollment_ids=[enrollment.pk],
        )
        self.assertEqual(len(moved), 1)
        self.assertEqual(moved[0].pk, enrollment.pk)
        moved[0].refresh_from_db()
        self.assertEqual(moved[0].enrolled_class.pk, target_class.pk)

    def test_bulk_move_enrollments_by_count(self):
        enrollment = enroll_student(actor=self.instructor, student=self.student, enrolled_class=self.individual_class)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk Count Target", class_type=ClassType.INDIVIDUAL,
        )
        moved = bulk_move_enrollments(
            self.instructor, source_class=self.individual_class,
            target_class=target_class, count=1,
        )
        self.assertEqual(len(moved), 1)

    def test_bulk_move_enrollments_no_args_raises(self):
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk No Args", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            bulk_move_enrollments(
                self.instructor, source_class=self.individual_class,
                target_class=target_class,
            )

    def test_bulk_move_enrollments_both_args_raises(self):
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk Both Args", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            bulk_move_enrollments(
                self.instructor, source_class=self.individual_class,
                target_class=target_class, enrollment_ids=[], count=1,
            )

    def test_bulk_move_enrollments_inactive_target_raises(self):
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk Inactive", class_type=ClassType.INDIVIDUAL,
        )
        class_service.deactivate_class(target_class)
        with self.assertRaises(DjangoValidationError):
            bulk_move_enrollments(
                self.instructor, source_class=self.individual_class,
                target_class=target_class, count=1,
            )

    def test_bulk_move_enrollments_different_branch_raises(self):
        other_branch = Branch.objects.create(name="Other Branch", code="OB03")
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=other_branch, instructor=self.instructor,
            name="Bulk Diff Branch", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            bulk_move_enrollments(
                self.instructor, source_class=self.individual_class,
                target_class=target_class, count=1,
            )

    def test_bulk_move_enrollments_no_active_enrollments_raises(self):
        target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Bulk No Active", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            bulk_move_enrollments(
                self.instructor, source_class=self.individual_class,
                target_class=target_class, count=1,
            )


class PaymentServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = program_service.create_program(name="Programming", slug="programming")
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.student_user = user_service.create_student_user(
            "student@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(self.student_user)
        Student.objects.create(user=self.student_user, branch=self.branch, date_joined=date.today())
        self.student = Student.objects.get(user=self.student_user)

        self.instructor = user_service.create_staff_user(
            "instructor@test.com", "John", "Doe", "StrongP@ssw0rd!2026", self.branch,
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch, instructor=self.instructor,
            name="Python Test", class_type=ClassType.INDIVIDUAL,
        )
        self.enrollment = enroll_student(
            actor=self.instructor, student=self.student, enrolled_class=self.klass,
        )

    def test_record_payment_cash(self):
        payment = record_payment(
            self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
            payment_method=PaymentMethod.CASH,
        )
        self.assertEqual(payment.payment_method, PaymentMethod.CASH)
        self.assertEqual(payment.status, PaymentStatus.PAID)
        self.assertEqual(payment.verified_by, self.instructor)
        self.assertIsNotNone(payment.verified_at)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertEqual(self.enrollment.verification_status, VerificationStatus.VERIFIED)
        self.assertIsNotNone(self.enrollment.enrollment_number)

    def test_record_payment_bank_transfer(self):
        payment = record_payment(
            self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="TXN-12345", bank_name="CBE",
        )
        self.assertEqual(payment.bank_name, "CBE")
        self.assertEqual(payment.transaction_reference, "TXN-12345")
        self.assertEqual(payment.status, PaymentStatus.PAID)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, EnrollmentStatus.ACTIVE)

    def test_record_payment_non_cash_missing_evidence_raises(self):
        with self.assertRaises(DjangoValidationError):
            record_payment(
                self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
                payment_method=PaymentMethod.MOBILE_MONEY,
            )

    def test_record_payment_twice_raises(self):
        record_payment(
            self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
            payment_method=PaymentMethod.CASH,
        )
        with self.assertRaises(DjangoValidationError):
            record_payment(
                self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
                payment_method=PaymentMethod.CASH,
            )

    def test_record_payment_non_pending_enrollment_raises(self):
        self.enrollment.status = EnrollmentStatus.ACTIVE
        self.enrollment.save()
        with self.assertRaises(DjangoValidationError):
            record_payment(
                self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"),
                payment_method=PaymentMethod.CASH,
            )

    def test_set_under_review(self):
        self.enrollment.verification_status = VerificationStatus.SUBMITTED
        self.enrollment.save()
        result = set_under_review(self.instructor, enrollment=self.enrollment)
        self.assertEqual(result.verification_status, VerificationStatus.UNDER_REVIEW)

    def test_set_under_review_not_submitted_raises(self):
        self.enrollment.verification_status = VerificationStatus.VERIFIED
        self.enrollment.save()
        with self.assertRaises(DjangoValidationError):
            set_under_review(self.instructor, enrollment=self.enrollment)

    def test_reject_payment(self):
        self.enrollment.verification_status = VerificationStatus.SUBMITTED
        self.enrollment.save()
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment, amount=Decimal("500.00"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="TXN-123",
            status=PaymentStatus.PENDING,
        )
        result = reject_payment(
            self.instructor, enrollment=self.enrollment,
            rejection_reason="Transaction not found.",
        )
        self.assertEqual(result.verification_status, VerificationStatus.REJECTED)
        self.assertEqual(result.rejection_reason, "Transaction not found.")
        self.assertEqual(result.status, EnrollmentStatus.REJECTED)

    def test_list_payments(self):
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.PAID,
        )
        self.assertEqual(list_payments().count(), 1)


class AttendanceServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = Program.objects.create(name="Test Program", slug="test-program")
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Test Sub", slug="test-sub", group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.manager = user_service.create_staff_user(
            "manager@test.com", "Branch", "Manager", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.BRANCH_MANAGER,
        )
        user_service.activate_user(self.manager)
        self.manager.is_email_verified = True
        self.manager.save()

        self.instructor = user_service.create_staff_user(
            "instructor-att@test.com", "John", "Doe", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Att Class",
            class_type=ClassType.INDIVIDUAL,
        )

        self.student_user = user_service.create_student_user(
            "student-att@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )

    def test_create_session(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(), topic="Intro",
        )
        self.assertEqual(session.enrolled_class, self.klass)
        self.assertEqual(session.topic, "Intro")
        self.assertEqual(session.recorded_by, self.instructor)

    def test_create_session_requires_instructor_access(self):
        other_instructor = user_service.create_staff_user(
            "other-att@test.com", "Other", "Inst", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(other_instructor)
        with self.assertRaises(DjangoValidationError):
            attendance_service.create_session(
                actor=other_instructor, enrolled_class=self.klass,
                session_date=date.today(),
            )

    def test_create_session_allows_manager(self):
        session = attendance_service.create_session(
            actor=self.manager, enrolled_class=self.klass,
            session_date=date.today(),
        )
        self.assertIsNotNone(session)

    def test_duplicate_session_date_raises(self):
        attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        with self.assertRaises(Exception):
            attendance_service.create_session(
                actor=self.instructor, enrolled_class=self.klass,
                session_date=date.today(),
            )

    def test_record_attendance(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        record = attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        self.assertEqual(record.status, AttendanceStatus.PRESENT)
        self.assertEqual(record.enrollment, self.enrollment)

    def test_record_attendance_inactive_enrollment_raises(self):
        self.enrollment.status = EnrollmentStatus.PENDING_VERIFICATION
        self.enrollment.save()
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        with self.assertRaises(DjangoValidationError):
            attendance_service.record_attendance(
                actor=self.instructor, session=session,
                enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
            )

    def test_bulk_record_attendance(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        records = attendance_service.bulk_record_attendance(
            actor=self.instructor, session=session,
            records=[{"enrollment": self.enrollment, "status": AttendanceStatus.PRESENT}],
        )
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].status, AttendanceStatus.PRESENT)

    def test_update_attendance_record(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        record = attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        updated = attendance_service.update_attendance_record(
            actor=self.instructor, record=record, status=AttendanceStatus.ABSENT,
        )
        self.assertEqual(updated.status, AttendanceStatus.ABSENT)

    def test_get_enrollment_attendance_history(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        history = attendance_service.get_enrollment_attendance_history(self.enrollment)
        self.assertEqual(history.count(), 1)

    def test_get_attendance_summary(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        attendance_service.record_attendance(
            actor=self.instructor, session=session,
            enrollment=self.enrollment, status=AttendanceStatus.PRESENT,
        )
        summary = attendance_service.get_attendance_summary(self.enrollment)
        self.assertEqual(summary["present"], 1)
        self.assertEqual(summary["total"], 1)

    def test_list_sessions(self):
        attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(),
        )
        attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today() + timedelta(days=1),
        )
        sessions = attendance_service.list_sessions()
        self.assertEqual(sessions.count(), 2)

    def test_update_session(self):
        session = attendance_service.create_session(
            actor=self.instructor, enrolled_class=self.klass,
            session_date=date.today(), topic="Original",
        )
        updated = attendance_service.update_session(
            self.instructor, session, topic="Updated Topic",
        )
        self.assertEqual(updated.topic, "Updated Topic")


class ProgressServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = Program.objects.create(
            name="Test Program", slug="test-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Test Sub", slug="test-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )

        self.manager = user_service.create_staff_user(
            "manager-prog@test.com", "Branch", "Manager", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.BRANCH_MANAGER,
        )
        user_service.activate_user(self.manager)
        self.manager.is_email_verified = True
        self.manager.save()

        self.instructor = user_service.create_staff_user(
            "instructor-prog@test.com", "John", "Doe", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.other_instructor = user_service.create_staff_user(
            "other-instr-prog@test.com", "Other", "Inst", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.other_instructor)
        self.other_instructor.is_email_verified = True
        self.other_instructor.save()

        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Prog Class",
            class_type=ClassType.INDIVIDUAL,
        )

        self.other_klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.other_instructor, name="Other Prog Class",
            class_type=ClassType.INDIVIDUAL,
        )

        self.student_user = user_service.create_student_user(
            "student-prog@test.com", "Test", "Student", "StrongP@ssw0rd!2026",
            self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )

        self.shared_milestone = progress_service.create_milestone(
            actor=self.manager,
            sub_program=self.sub_program,
            title="Variables",
            description="Learn about variables",
            scope_class=None,
        )

    def test_create_shared_milestone_as_manager(self):
        milestone = progress_service.create_milestone(
            actor=self.manager,
            sub_program=self.sub_program,
            title="Functions",
            description="Learn about functions",
            scope_class=None,
        )
        self.assertEqual(milestone.title, "Functions")
        self.assertIsNone(milestone.scope_class)
        self.assertTrue(milestone.is_active)

    def test_create_class_specific_milestone_as_instructor(self):
        milestone = progress_service.create_milestone(
            actor=self.instructor,
            sub_program=self.sub_program,
            title="Custom Topic",
            description="Instructor custom topic",
            scope_class=self.klass,
        )
        self.assertEqual(milestone.scope_class, self.klass)
        self.assertEqual(milestone.title, "Custom Topic")

    def test_instructor_cannot_create_shared_milestone(self):
        with self.assertRaises(DjangoValidationError):
            progress_service.create_milestone(
                actor=self.instructor,
                sub_program=self.sub_program,
                title="Shared By Instructor",
                scope_class=None,
            )

    def test_instructor_cannot_create_for_another_class(self):
        with self.assertRaises(DjangoValidationError):
            progress_service.create_milestone(
                actor=self.instructor,
                sub_program=self.sub_program,
                title="Wrong Class",
                scope_class=self.other_klass,
            )

    def test_list_milestones_returns_shared_and_class_specific(self):
        progress_service.create_milestone(
            actor=self.instructor,
            sub_program=self.sub_program,
            title="Class Only",
            scope_class=self.klass,
        )
        milestones = progress_service.list_milestones(
            sub_program=self.sub_program, scope_class=self.klass
        )
        titles = [m.title for m in milestones]
        self.assertIn("Variables", titles)
        self.assertIn("Class Only", titles)

    def test_update_milestone_as_manager(self):
        updated = progress_service.update_milestone(
            self.manager, self.shared_milestone, title="Updated Variables"
        )
        self.assertEqual(updated.title, "Updated Variables")

    def test_instructor_cannot_update_shared_milestone(self):
        with self.assertRaises(DjangoValidationError):
            progress_service.update_milestone(
                self.instructor, self.shared_milestone, title="Hacked"
            )

    def test_instructor_can_update_own_class_milestone(self):
        class_milestone = progress_service.create_milestone(
            actor=self.instructor,
            sub_program=self.sub_program,
            title="My Topic",
            scope_class=self.klass,
        )
        updated = progress_service.update_milestone(
            self.instructor, class_milestone, title="Updated Topic"
        )
        self.assertEqual(updated.title, "Updated Topic")

    def test_archive_milestone(self):
        archived = progress_service.archive_milestone(
            self.manager, self.shared_milestone
        )
        self.assertFalse(archived.is_active)

    def test_customize_milestone(self):
        customized = progress_service.customize_milestone(
            self.instructor, self.shared_milestone, self.klass
        )
        self.assertEqual(customized.title, self.shared_milestone.title)
        self.assertEqual(customized.scope_class, self.klass)
        self.assertIsNotNone(customized.id)

    def test_customize_requires_shared_milestone(self):
        class_milestone = progress_service.create_milestone(
            actor=self.instructor,
            sub_program=self.sub_program,
            title="Already Class",
            scope_class=self.klass,
        )
        with self.assertRaises(DjangoValidationError):
            progress_service.customize_milestone(
                self.instructor, class_milestone, self.klass
            )

    def test_record_progress(self):
        record = progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.IN_PROGRESS,
        )
        self.assertEqual(record.status, ProgressStatus.IN_PROGRESS)
        self.assertEqual(record.milestone, self.shared_milestone)
        self.assertEqual(record.enrollment, self.enrollment)

    def test_record_progress_sets_completed_at(self):
        record = progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.COMPLETED,
        )
        self.assertIsNotNone(record.completed_at)

    def test_record_progress_wrong_subprogram_raises(self):
        other_program = Program.objects.create(
            name="Other Program", slug="other-program",
        )
        other_sub = SubProgram.objects.create(
            program=other_program, name="Other Sub", slug="other-sub",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        other_milestone = progress_service.create_milestone(
            actor=self.manager, sub_program=other_sub, title="Other Topic",
        )
        with self.assertRaises(DjangoValidationError):
            progress_service.record_progress(
                actor=self.instructor,
                enrollment=self.enrollment,
                milestone=other_milestone,
            )

    def test_update_progress(self):
        record = progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
        )
        updated = progress_service.update_progress(
            self.instructor, record, status=ProgressStatus.COMPLETED
        )
        self.assertEqual(updated.status, ProgressStatus.COMPLETED)
        self.assertIsNotNone(updated.completed_at)

    def test_get_progress_history(self):
        progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.COMPLETED,
        )
        history = progress_service.get_progress_history(self.enrollment)
        self.assertEqual(history.count(), 1)

    def test_get_progress_summary(self):
        progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.COMPLETED,
        )
        summary = progress_service.get_progress_summary(self.enrollment)
        self.assertEqual(summary["completed"], 1)
        self.assertEqual(summary["total"], 1)

    def test_duplicate_milestone_title_raises(self):
        with self.assertRaises(DjangoValidationError):
            progress_service.create_milestone(
                actor=self.manager,
                sub_program=self.sub_program,
                title="Variables",
                scope_class=None,
            )

    def test_duplicate_progress_updates(self):
        progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.NOT_STARTED,
        )
        record = progress_service.record_progress(
            actor=self.instructor,
            enrollment=self.enrollment,
            milestone=self.shared_milestone,
            status=ProgressStatus.COMPLETED,
        )
        self.assertEqual(record.status, ProgressStatus.COMPLETED)


class LearningMaterialServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = Program.objects.create(
            name="Material Program", slug="material-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Material Sub", slug="material-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.manager = user_service.create_staff_user(
            "manager-mat@test.com", "Branch", "Manager", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.BRANCH_MANAGER,
        )
        user_service.activate_user(self.manager)
        self.manager.is_email_verified = True
        self.manager.save()

        self.instructor = user_service.create_staff_user(
            "instructor-mat@test.com", "John", "Doe", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.other_instructor = user_service.create_staff_user(
            "other-instr-mat@test.com", "Other", "Inst", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.other_instructor)
        self.other_instructor.is_email_verified = True
        self.other_instructor.save()

        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Mat Class",
            class_type=ClassType.INDIVIDUAL,
        )

        self.student_user = user_service.create_student_user(
            "student-mat@test.com", "Test", "Student", "StrongP@ssw0rd!2026",
            self.branch,
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

    def test_upload_material_as_manager(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Material Manager", file=file,
        )
        self.assertEqual(material.title, "Material Manager")
        self.assertEqual(material.material_type, MaterialType.PDF)
        self.assertEqual(material.uploaded_by, self.manager)

    def test_upload_material_as_instructor(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.instructor, sub_program=self.sub_program,
            title="Material Instructor", file=file,
        )
        self.assertEqual(material.title, "Material Instructor")

    def test_instructor_cannot_upload_to_unowned_sub_program(self):
        file = self._create_temp_file()
        other_program = Program.objects.create(
            name="Other Prog", slug="other-prog",
        )
        other_sub = SubProgram.objects.create(
            program=other_program, name="Other Sub", slug="other-sub",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        with self.assertRaises(DjangoValidationError):
            learning_material_service.upload_material(
                actor=self.instructor, sub_program=other_sub,
                title="No Access", file=file,
            )

    def test_list_materials(self):
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="List Test", file=file,
        )
        materials = learning_material_service.list_materials(
            sub_program=self.sub_program,
        )
        self.assertEqual(materials.count(), 1)

    def test_list_materials_filters_by_uploaded_by(self):
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="By Manager", file=file,
        )
        materials = learning_material_service.list_materials(
            uploaded_by=self.manager,
        )
        self.assertEqual(materials.count(), 1)
        materials = learning_material_service.list_materials(
            uploaded_by=self.instructor,
        )
        self.assertEqual(materials.count(), 0)

    def test_update_material_title(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Old Title", file=file,
        )
        updated = learning_material_service.update_material(
            self.manager, material, title="New Title",
        )
        self.assertEqual(updated.title, "New Title")

    def test_update_material_file_replaces_type(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="File Test", file=file,
        )
        self.assertEqual(material.material_type, MaterialType.PDF)
        png_file = self._create_temp_file(name="image.png")
        updated = learning_material_service.update_material(
            self.manager, material, file=png_file,
        )
        self.assertEqual(updated.material_type, MaterialType.IMAGE)

    def test_instructor_cannot_update_others_material(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Not Yours", file=file,
        )
        with self.assertRaises(DjangoValidationError):
            learning_material_service.update_material(
                self.instructor, material, title="Hacked",
            )

    def test_delete_material_soft_deletes(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="To Delete", file=file,
        )
        deleted = learning_material_service.delete_material(
            self.manager, material,
        )
        self.assertFalse(deleted.is_active)

    def test_deleted_material_not_in_list(self):
        file = self._create_temp_file()
        material = learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Gone", file=file,
        )
        learning_material_service.delete_material(self.manager, material)
        materials = learning_material_service.list_materials(
            sub_program=self.sub_program,
        )
        self.assertEqual(materials.count(), 0)

    def test_get_student_materials(self):
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Student Can See", file=file,
        )
        materials = learning_material_service.get_student_materials(
            self.student_model,
        )
        self.assertEqual(materials.count(), 1)

    def test_get_student_materials_excludes_other_sub_programs(self):
        file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.manager, sub_program=self.sub_program,
            title="Visible", file=file,
        )
        other_program = Program.objects.create(
            name="Hidden Prog", slug="hidden-prog",
        )
        other_sub = SubProgram.objects.create(
            program=other_program, name="Hidden Sub", slug="hidden-sub",
            group_fee=Decimal("400.00"), individual_fee=Decimal("400.00"),
        )
        other_file = self._create_temp_file()
        learning_material_service.upload_material(
            actor=self.manager, sub_program=other_sub,
            title="Hidden", file=other_file,
        )
        materials = learning_material_service.get_student_materials(
            self.student_model,
        )
        self.assertEqual(materials.count(), 1)

    def test_detect_material_type_from_extension(self):
        from apps.academic.services.learning_material_service import _detect_material_type
        self.assertEqual(_detect_material_type("doc.pdf"), MaterialType.PDF)
        self.assertEqual(_detect_material_type("slide.pptx"), MaterialType.PPTX)
        self.assertEqual(_detect_material_type("photo.jpg"), MaterialType.IMAGE)
        from django.core.exceptions import ValidationError as DjangoValidationError
        with self.assertRaises(DjangoValidationError):
            _detect_material_type("unknown.xyz")


class CertificateServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = Program.objects.create(
            name="Cert Program", slug="cert-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Cert Sub", slug="cert-sub",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.manager = user_service.create_staff_user(
            "mgr-cert@test.com", "Branch", "Manager", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.BRANCH_MANAGER,
        )
        user_service.activate_user(self.manager)
        self.manager.is_email_verified = True
        self.manager.save()

        self.secretary = user_service.create_staff_user(
            "sec-cert@test.com", "Branch", "Secretary", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.SECRETARY,
        )
        user_service.activate_user(self.secretary)
        self.secretary.is_email_verified = True
        self.secretary.save()

        self.instructor = user_service.create_staff_user(
            "instr-cert@test.com", "John", "Doe", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Cert Class",
            class_type=ClassType.INDIVIDUAL,
        )

        self.student_user = user_service.create_student_user(
            "stud-cert@test.com", "Test", "Student", "StrongP@ssw0rd!2026",
            self.branch,
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

        logo_buf = BytesIO()
        Image.new("RGB", (50, 50), color="red").save(logo_buf, format="PNG")
        self.logo_file = ContentFile(logo_buf.getvalue(), name="logo.png")

        sig_buf = BytesIO()
        Image.new("RGB", (80, 30), color="black").save(sig_buf, format="PNG")
        self.sig_file = ContentFile(sig_buf.getvalue(), name="sig.png")

    def _create_certificate(self, **overrides):
        from apps.academic.services.certificate_service import create_certificate
        kwargs = dict(
            actor=self.manager,
            sub_program=self.sub_program,
            title="Test Certificate",
            background=self.bg_file,
            body_text="This certifies that {{student_name}} has completed {{sub_program_name}}.",
        )
        kwargs.update(overrides)
        if "background" not in overrides:
            kwargs["background"] = self.bg_file
        return create_certificate(**kwargs)

    def test_create_certificate_template(self):
        cert = self._create_certificate()
        self.assertEqual(cert.title, "Test Certificate")
        self.assertEqual(cert.sub_program, self.sub_program)
        self.assertTrue(cert.is_active)

    def test_update_certificate_template(self):
        from apps.academic.services.certificate_service import update_certificate
        cert = self._create_certificate()
        updated = update_certificate(self.manager, cert, title="Updated Cert")
        self.assertEqual(updated.title, "Updated Cert")

    def test_activate_deactivate_template(self):
        from apps.academic.services.certificate_service import (
            activate_certificate,
            deactivate_certificate,
        )
        cert = self._create_certificate()
        deactivated = deactivate_certificate(self.manager, cert)
        self.assertFalse(deactivated.is_active)
        activated = activate_certificate(self.manager, cert)
        self.assertTrue(activated.is_active)

    def test_generate_certificate_number(self):
        from apps.academic.services.certificate_service import (
            generate_certificate_number,
            issue_certificate,
        )
        cert = self._create_certificate()
        sc = issue_certificate(
            actor=self.manager, student=self.student_model,
            certificate=cert,
        )
        self.assertTrue(sc.certificate_number.startswith("CERT-cert-sub-"))

    def test_issue_certificate(self):
        from apps.academic.services.certificate_service import issue_certificate
        cert = self._create_certificate()
        sc = issue_certificate(
            actor=self.manager, student=self.student_model,
            certificate=cert,
        )
        self.assertEqual(sc.student, self.student_model)
        self.assertEqual(sc.certificate, cert)
        self.assertEqual(sc.sub_program, self.sub_program)
        self.assertEqual(sc.issued_by, self.manager)

    def test_issue_certificate_duplicate_student_sub_program_raises(self):
        from apps.academic.services.certificate_service import issue_certificate
        cert = self._create_certificate()
        issue_certificate(
            actor=self.manager, student=self.student_model,
            certificate=cert,
        )
        with self.assertRaises(DjangoValidationError):
            issue_certificate(
                actor=self.manager, student=self.student_model,
                certificate=cert,
            )

    def test_issue_certificate_unauthorized_role_raises(self):
        from apps.academic.services.certificate_service import issue_certificate
        cert = self._create_certificate()
        with self.assertRaises(DjangoValidationError):
            issue_certificate(
                actor=self.instructor, student=self.student_model,
                certificate=cert,
            )

    def test_get_student_certificate_by_number(self):
        from apps.academic.services.certificate_service import (
            get_student_certificate_by_number,
            issue_certificate,
        )
        cert = self._create_certificate()
        sc = issue_certificate(
            actor=self.secretary, student=self.student_model,
            certificate=cert,
        )
        found = get_student_certificate_by_number(sc.certificate_number)
        self.assertEqual(found.id, sc.id)

    def test_list_student_certificates(self):
        from apps.academic.services.certificate_service import (
            get_student_certificates,
            issue_certificate,
        )
        cert = self._create_certificate()
        issue_certificate(
            actor=self.manager, student=self.student_model,
            certificate=cert,
        )
        certs = get_student_certificates(student=self.student_model)
        self.assertEqual(certs.count(), 1)


class AcademicReportServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Report Branch", code="RB01")
        self.program = Program.objects.create(
            name="Report Program", slug="report-program",
            supports_group=True, supports_individual=True,
        )
        self.sub_program = SubProgram.objects.create(
            program=self.program, name="Report Sub", slug="report-sub",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        self.instructor = user_service.create_staff_user(
            "rep-instr@test.com", "Report", "Instructor", "StrongP@ssw0rd!2026",
            branch=self.branch, role=Roles.INSTRUCTOR,
        )
        user_service.activate_user(self.instructor)
        self.instructor.is_email_verified = True
        self.instructor.save()

        self.student_user = user_service.create_student_user(
            "rep-stud@test.com", "Report", "Student", "StrongP@ssw0rd!2026",
            self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student_model = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )
        self.klass = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch,
            instructor=self.instructor, name="Report Class",
            class_type=ClassType.GROUP, capacity=10,
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_model, enrolled_class=self.klass,
            status=EnrollmentStatus.ACTIVE,
        )
        EnrollmentPayment.objects.create(
            enrollment=self.enrollment, amount=Decimal("300.00"),
            payment_method=PaymentMethod.CASH, status=PaymentStatus.PAID,
        )

    # -- Student reports --

    def test_generate_student_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_student_report
        pdf = generate_student_report(self.student_model.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_student_report_invalid_student(self):
        from apps.academic.services.academic_report_service import generate_student_report
        from django.http import Http404
        with self.assertRaises(Http404):
            generate_student_report("00000000-0000-0000-0000-000000000000")

    def test_generate_enrollment_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_enrollment_report
        pdf = generate_enrollment_report(self.student_model.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_attendance_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_attendance_report
        pdf = generate_attendance_report(self.student_model.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_attendance_report_filtered_by_enrollment(self):
        from apps.academic.services.academic_report_service import generate_attendance_report
        pdf = generate_attendance_report(self.student_model.id, enrollment_id=self.enrollment.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_progress_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_progress_report
        pdf = generate_progress_report(self.student_model.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_certificate_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_certificate_report
        pdf = generate_certificate_report(self.student_model.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    # -- Staff reports --

    def test_generate_class_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_class_report
        pdf = generate_class_report(self.klass.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_sub_program_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_sub_program_report
        pdf = generate_sub_program_report(self.sub_program.id)
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_generate_program_report_returns_pdf(self):
        from apps.academic.services.academic_report_service import generate_program_report
        pdf = generate_program_report(self.program.id)
        self.assertTrue(pdf.startswith(b"%PDF"))


class TransferServiceTest(TestCase):
    def setUp(self):
        self.branch_a = Branch.objects.create(name="Branch A", code="BA01")
        self.branch_b = Branch.objects.create(name="Branch B", code="BB01")
        self.program = program_service.create_program(
            name="Programming", slug="programming", supports_group=True, supports_individual=True,
        )
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.instructor = user_service.create_staff_user(
            "inst@test.com", "John", "Doe", "StrongP@ssw0rd!2026", self.branch_a,
        )
        self.student_user = user_service.create_student_user(
            "stud@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch_a,
        )
        user_service.activate_user(self.student_user)
        self.student = Student.objects.create(
            user=self.student_user, branch=self.branch_a, date_joined=date.today(),
        )

        self.source_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch_a, instructor=self.instructor,
            name="Source Class", class_type=ClassType.INDIVIDUAL,
        )
        self.target_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch_b, instructor=self.instructor,
            name="Target Class", class_type=ClassType.INDIVIDUAL,
        )

        self.enrollment = enroll_student(
            None, student=self.student, enrolled_class=self.source_class,
        )
        self.enrollment.status = EnrollmentStatus.ACTIVE
        self.enrollment.save()

    def test_request_transfer_success(self):
        transfer = request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        self.assertEqual(transfer.status, BranchTransferRequest.TransferStatus.PENDING)
        self.assertEqual(transfer.enrollment, self.enrollment)
        self.assertEqual(transfer.from_branch, self.branch_a)
        self.assertEqual(transfer.to_branch, self.branch_b)

    def test_request_transfer_non_active_enrollment_raises(self):
        self.enrollment.status = EnrollmentStatus.PENDING_VERIFICATION
        self.enrollment.save()
        with self.assertRaises(DjangoValidationError):
            request_transfer(
                self.instructor,
                enrollment=self.enrollment,
                target_class=self.target_class,
                to_branch=self.branch_b,
            )

    def test_request_transfer_same_branch_raises(self):
        same_branch_class = class_service.create_class(
            sub_program=self.sub_program, branch=self.branch_a, instructor=self.instructor,
            name="Same Branch Class", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            request_transfer(
                self.instructor,
                enrollment=self.enrollment,
                target_class=same_branch_class,
                to_branch=self.branch_a,
            )

    def test_request_transfer_inactive_target_raises(self):
        class_service.deactivate_class(self.target_class)
        with self.assertRaises(DjangoValidationError):
            request_transfer(
                self.instructor,
                enrollment=self.enrollment,
                target_class=self.target_class,
                to_branch=self.branch_b,
            )

    def test_request_transfer_duplicate_pending_raises(self):
        request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        with self.assertRaises(DjangoValidationError):
            request_transfer(
                self.instructor,
                enrollment=self.enrollment,
                target_class=self.target_class,
                to_branch=self.branch_b,
            )

    def test_approve_transfer_success(self):
        transfer = request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        new_enrollment, updated = approve_transfer(self.instructor, transfer_request=transfer)
        self.assertEqual(updated.status, BranchTransferRequest.TransferStatus.APPROVED)
        self.assertEqual(new_enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertEqual(new_enrollment.transferred_from, self.enrollment)
        self.assertIsNotNone(new_enrollment.enrollment_number)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, EnrollmentStatus.CANCELLED)

    def test_approve_transfer_non_pending_raises(self):
        transfer = request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        approve_transfer(self.instructor, transfer_request=transfer)
        with self.assertRaises(DjangoValidationError):
            approve_transfer(self.instructor, transfer_request=transfer)

    def test_reject_transfer_success(self):
        transfer = request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        updated = reject_transfer(
            self.instructor,
            transfer_request=transfer,
            rejection_reason="No available slots.",
        )
        self.assertEqual(updated.status, BranchTransferRequest.TransferStatus.REJECTED)
        self.assertEqual(updated.rejection_reason, "No available slots.")

    def test_reject_transfer_non_pending_raises(self):
        transfer = request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        reject_transfer(self.instructor, transfer_request=transfer, rejection_reason="No reason")
        with self.assertRaises(DjangoValidationError):
            reject_transfer(self.instructor, transfer_request=transfer, rejection_reason="Already rejected")

    def test_list_transfer_requests(self):
        request_transfer(
            self.instructor,
            enrollment=self.enrollment,
            target_class=self.target_class,
            to_branch=self.branch_b,
        )
        transfers = list_transfer_requests()
        self.assertEqual(transfers.count(), 1)


class SwitchSubProgramServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = program_service.create_program(
            name="Programming", slug="programming", supports_group=True, supports_individual=True,
        )
        self.sub_program_a = program_service.create_sub_program(
            program=self.program, name="Python", slug="python",
            group_fee=Decimal("300.00"), individual_fee=Decimal("300.00"),
        )
        self.sub_program_b = program_service.create_sub_program(
            program=self.program, name="Java", slug="java",
            group_fee=Decimal("500.00"), individual_fee=Decimal("500.00"),
        )
        self.instructor = user_service.create_staff_user(
            "inst2@test.com", "John", "Doe", "StrongP@ssw0rd!2026", self.branch,
        )
        self.student_user = user_service.create_student_user(
            "stud2@test.com", "Test", "Student", "StrongP@ssw0rd!2026", self.branch,
        )
        user_service.activate_user(self.student_user)
        self.student = Student.objects.create(
            user=self.student_user, branch=self.branch, date_joined=date.today(),
        )

        self.current_class = class_service.create_class(
            sub_program=self.sub_program_a, branch=self.branch, instructor=self.instructor,
            name="Python Group", class_type=ClassType.INDIVIDUAL,
        )
        self.target_class = class_service.create_class(
            sub_program=self.sub_program_b, branch=self.branch, instructor=self.instructor,
            name="Java Group", class_type=ClassType.INDIVIDUAL,
        )

        self.enrollment = enroll_student(
            None, student=self.student, enrolled_class=self.current_class,
        )
        self.enrollment.status = EnrollmentStatus.ACTIVE
        self.enrollment.save()

    def test_switch_subprogram_success(self):
        new_enrollment, amount_due = switch_subprogram(
            self.instructor,
            current_enrollment=self.enrollment,
            target_class=self.target_class,
        )
        self.assertEqual(new_enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertEqual(new_enrollment.transferred_from, self.enrollment)
        self.assertIsNotNone(new_enrollment.enrollment_number)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, EnrollmentStatus.CANCELLED)

    def test_switch_subprogram_fee_difference(self):
        new_enrollment, amount_due = switch_subprogram(
            self.instructor,
            current_enrollment=self.enrollment,
            target_class=self.target_class,
        )
        self.assertEqual(amount_due, 200)

    def test_switch_subprogram_non_active_raises(self):
        self.enrollment.status = EnrollmentStatus.PENDING_VERIFICATION
        self.enrollment.save()
        with self.assertRaises(DjangoValidationError):
            switch_subprogram(
                self.instructor,
                current_enrollment=self.enrollment,
                target_class=self.target_class,
            )

    def test_switch_subprogram_inactive_target_raises(self):
        class_service.deactivate_class(self.target_class)
        with self.assertRaises(DjangoValidationError):
            switch_subprogram(
                self.instructor,
                current_enrollment=self.enrollment,
                target_class=self.target_class,
            )

    def test_switch_subprogram_different_branch_raises(self):
        other_branch = Branch.objects.create(name="Other", code="OB99")
        other_class = class_service.create_class(
            sub_program=self.sub_program_b, branch=other_branch, instructor=self.instructor,
            name="Other Branch Class", class_type=ClassType.INDIVIDUAL,
        )
        with self.assertRaises(DjangoValidationError):
            switch_subprogram(
                self.instructor,
                current_enrollment=self.enrollment,
                target_class=other_class,
            )

    def test_get_all_related_enrollments(self):
        new_enrollment, _ = switch_subprogram(
            self.instructor,
            current_enrollment=self.enrollment,
            target_class=self.target_class,
        )
        related = get_all_related_enrollments(new_enrollment)
        self.assertEqual(len(related), 2)
        self.assertEqual(related[0], self.enrollment)
        self.assertEqual(related[1], new_enrollment)
