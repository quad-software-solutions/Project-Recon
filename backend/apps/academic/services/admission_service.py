from datetime import date

from django.db import transaction

from apps.academic.models import Student
from apps.accounts.services.user_service import (
    create_student_user,
    activate_user,
)
from apps.shared.audit.services import log_action


def admit_student(
    *,
    email,
    first_name,
    last_name,
    password,
    phone_number=None,
    branch,
    date_joined=None,
    guardian_name="",
    guardian_phone="",
    guardian_email="",
    assigned_by=None,
):
    if date_joined is None:
        date_joined = date.today()

    with transaction.atomic():
        user = create_student_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            branch=branch,
            assigned_by=assigned_by,
        )

        if phone_number:
            user.phone_number = phone_number
            user.save(update_fields=["phone_number"])

        activate_user(user, actor=assigned_by)

        student = Student.objects.create(
            user=user,
            branch=branch,
            date_joined=date_joined,
            guardian_name=guardian_name,
            guardian_phone=guardian_phone,
            guardian_email=guardian_email,
        )

    log_action(
        actor=assigned_by,
        action="student.admitted",
        resource_type="Student",
        resource_id=student.id,
        branch=branch,
    )

    return student
