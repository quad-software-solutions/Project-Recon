from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase

from apps.academic.constants import ClassType
from apps.academic.models import Program, SubProgram, Class
from apps.academic.services import program_service, class_service
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
