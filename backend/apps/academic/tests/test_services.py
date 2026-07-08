from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase, override_settings

from apps.academic.constants import (
    ClassType, ClassPeriod, AttendanceStatus, SessionStatus,
    EnrollmentStatus, PaymentMethod, PaymentProvider, PaymentStatus,
)
from apps.academic.models import (
    Program, SubProgram, Class, Student, EnrollmentPeriod,
    StaffAttendanceSession, StaffAttendanceRecord, Enrollment, EnrollmentPayment,
    AttendanceSession, AttendanceRecord,
)
from apps.academic.services import program_service, class_service, admission_service, student_service, attendance_service
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
    create_cash_payment,
    initialize_online_payment,
    verify_online_payment,
    list_payments,
    get_payment_or_404,
    get_payment_by_reference,
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
            fee=500.00,
        )
        self.assertEqual(sub.name, "Python")
        self.assertEqual(sub.program, self.program)
        self.assertEqual(sub.fee, 500.00)
        self.assertTrue(sub.is_active)

    def test_create_sub_program_with_duration(self):
        sub = program_service.create_sub_program(
            program=self.program,
            name="Scratch",
            slug="scratch",
            fee=300.00,
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
                fee=100.00,
                duration_unit="YEAR",
            )

    def test_duplicate_sub_program_name_in_same_program(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        with self.assertRaises(Exception):
            program_service.create_sub_program(
                program=self.program, name="Python", slug="python-2", fee=500.00
            )

    def test_list_sub_programs(self):
        program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        program_service.create_sub_program(
            program=self.program, name="Java", slug="java", fee=600.00
        )
        subs = program_service.list_sub_programs()
        self.assertEqual(subs.count(), 2)

    def test_update_sub_program(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        updated = program_service.update_sub_program(sub, name="Advanced Python", fee=700.00)
        self.assertEqual(updated.name, "Advanced Python")
        self.assertEqual(updated.fee, 700.00)

    def test_activate_deactivate_sub_program(self):
        sub = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=500.00
        )
        program_service.deactivate_sub_program(sub)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

        program_service.activate_sub_program(sub)
        sub.refresh_from_db()
        self.assertTrue(sub.is_active)


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
            program=self.program, name="Python", slug="python", fee=500.00
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
            program=self.program, name="Python", slug="python", fee=500.00
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
            program=self.program, name="Python", slug="python", fee=Decimal("500.00"),
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
        self.assertEqual(enrollment.status, EnrollmentStatus.PENDING_PAYMENT)

    def test_enroll_student_group_with_active_period(self):
        enrollment = enroll_student(
            actor=self.instructor,
            student=self.student,
            enrolled_class=self.group_class,
        )
        self.assertEqual(enrollment.status, EnrollmentStatus.PENDING_PAYMENT)

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


@override_settings(PAYMENT_PROVIDER="chapa")
class PaymentServiceTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.program = program_service.create_program(name="Programming", slug="programming")
        self.sub_program = program_service.create_sub_program(
            program=self.program, name="Python", slug="python", fee=Decimal("500.00"),
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

    def test_create_cash_payment(self):
        payment = create_cash_payment(self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"))
        self.assertEqual(payment.payment_method, PaymentMethod.CASH)
        self.assertEqual(payment.status, PaymentStatus.PAID)
        self.assertIsNotNone(payment.payment_date)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, EnrollmentStatus.ACTIVE)

    def test_create_cash_payment_wrong_amount_raises(self):
        with self.assertRaises(Exception):
            self.enrollment.status = EnrollmentStatus.ACTIVE
            self.enrollment.save()
            create_cash_payment(self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"))

    def test_create_cash_payment_twice_raises(self):
        create_cash_payment(self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"))
        with self.assertRaises(Exception):
            create_cash_payment(self.instructor, enrollment=self.enrollment, amount=Decimal("500.00"))

    @patch("apps.academic.services.payment_service.shared_initialize_payment")
    def test_initialize_online_payment(self, mock_init):
        mock_init.return_value = {
            "provider": "chapa", "status": "success", "provider_status": "success",
            "reference": "ENROLL-abcd1234-abcdef123456", "provider_transaction_id": "tx_123",
            "amount": Decimal("500.00"), "currency": "ETB",
            "checkout_url": "https://checkout.chapa.co/pay/test", "raw": {},
        }
        payment, checkout_url = initialize_online_payment(
            actor=self.instructor,
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            reference="ENROLL-abcd1234-abcdef123456",
            callback_url="https://example.com/webhook",
            customer={"email": "student@test.com", "first_name": "Test", "last_name": "Student"},
        )
        self.assertEqual(payment.payment_method, PaymentMethod.ONLINE)
        self.assertEqual(payment.status, PaymentStatus.PENDING)
        self.assertEqual(payment.payment_provider, "chapa")
        self.assertIn("checkout.chapa.co", checkout_url)

    @patch("apps.academic.services.payment_service.shared_verify_payment")
    def test_verify_online_payment_success(self, mock_verify):
        payment = EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.ONLINE,
            payment_provider=PaymentProvider.CHAPA,
            transaction_reference="ENROLL-abcd1234-abcdef123456",
            status=PaymentStatus.PENDING,
        )
        mock_verify.return_value = {
            "provider": "chapa", "status": "success", "provider_status": "success",
            "reference": "ENROLL-abcd1234-abcdef123456", "provider_transaction_id": "tx_123",
            "amount": Decimal("500.00"), "currency": "ETB", "raw": {},
        }
        result = verify_online_payment(reference="ENROLL-abcd1234-abcdef123456")
        self.assertEqual(result.status, PaymentStatus.PAID)
        result.enrollment.refresh_from_db()
        self.assertEqual(result.enrollment.status, EnrollmentStatus.ACTIVE)

    @patch("apps.academic.services.payment_service.shared_verify_payment")
    def test_verify_online_payment_amount_mismatch_fails(self, mock_verify):
        payment = EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.ONLINE,
            payment_provider=PaymentProvider.CHAPA,
            transaction_reference="ENROLL-a9999999-abcdef123456",
            status=PaymentStatus.PENDING,
        )
        mock_verify.return_value = {
            "provider": "chapa", "status": "success", "provider_status": "success",
            "reference": "ENROLL-a9999999-abcdef123456", "provider_transaction_id": "tx_999",
            "amount": Decimal("100.00"), "currency": "ETB", "raw": {},
        }
        with self.assertRaises(DjangoValidationError) as ctx:
            verify_online_payment(reference="ENROLL-a9999999-abcdef123456")
        self.assertIn("amount mismatch", str(ctx.exception).lower())
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.FAILED)
        payment.enrollment.refresh_from_db()
        self.assertEqual(payment.enrollment.status, EnrollmentStatus.CANCELLED)

    @patch("apps.academic.services.payment_service.shared_verify_payment")
    def test_verify_online_payment_failed_status(self, mock_verify):
        payment = EnrollmentPayment.objects.create(
            enrollment=self.enrollment,
            amount=Decimal("500.00"),
            payment_method=PaymentMethod.ONLINE,
            payment_provider=PaymentProvider.CHAPA,
            transaction_reference="ENROLL-a7777777-abcdef123456",
            status=PaymentStatus.PENDING,
        )
        mock_verify.return_value = {
            "provider": "chapa", "status": "failed", "provider_status": "failed",
            "reference": "ENROLL-a7777777-abcdef123456", "provider_transaction_id": "tx_777",
            "amount": Decimal("500.00"), "currency": "ETB", "raw": {},
        }
        result = verify_online_payment(reference="ENROLL-a7777777-abcdef123456")
        self.assertEqual(result.status, PaymentStatus.FAILED)

    def test_verify_invalid_reference_format_raises(self):
        with self.assertRaises(DjangoValidationError):
            verify_online_payment(reference="invalid-ref")

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
            program=self.program, name="Test Sub", slug="test-sub", fee=Decimal("500.00"),
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
        self.enrollment.status = EnrollmentStatus.PENDING_PAYMENT
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
