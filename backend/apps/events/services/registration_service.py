from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.academic.models import Student
from apps.events.constants import EventType, PaymentStatus, RegistrationStatus
from apps.events.models import Event, EventRegistration, Tournament, TournamentTeam
from apps.events.services.validators import RegistrationValidator, TournamentTeamValidator
from apps.shared.audit.services import log_action


def get_registration_or_404(pk):
    """
    Retrieve an EventRegistration by primary key or raise NotFound.

    Args:
        pk: Registration UUID as string or UUID instance.

    Returns:
        EventRegistration instance with related event, student, and user.
    """
    try:
        return EventRegistration.objects.select_related(
            "event", "student__user", "event__tournament"
        ).get(id=pk)
    except EventRegistration.DoesNotExist:
        raise NotFound("Registration not found.")


def list_registrations(event_id=None, status=None, student_id=None, branch_ids=None):
    """
    Return registrations, optionally filtered.

    Args:
        event_id: Optional event UUID to filter by.
        status: Optional registration status to filter by.
        student_id: Optional student UUID to filter by.
        branch_ids: Optional set/list of branch UUIDs to scope by.

    Returns:
        QuerySet of EventRegistration objects.
    """
    qs = EventRegistration.objects.select_related(
        "event", "student__user", "event__tournament"
    ).all()
    if event_id:
        qs = qs.filter(event_id=event_id)
    if status:
        qs = qs.filter(registration_status=status)
    if student_id:
        qs = qs.filter(student_id=student_id)
    if branch_ids:
        qs = qs.filter(event__branch_id__in=branch_ids)
    return qs


def register_for_event(event_id, data: dict, actor=None) -> EventRegistration:
    """
    Register a participant for an event.

    Args:
        event_id: Event UUID.
        data: Dictionary with registration data. For public registrations:
              'public_full_name', 'public_email', 'public_phone', optional
              'public_organization'. For student registrations: 'student'
              (UUID or Student instance). May include 'payment' dict with
              evidence fields when payment is required.
        actor: Optional User performing the action.

    Returns:
        Created EventRegistration instance.

    Raises:
        ValidationError: If business rules are violated.
        NotFound: If event not found.
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise NotFound("Event not found.")

    RegistrationValidator.validate_registration_enabled(event)
    RegistrationValidator.validate_registration_deadline(event)
    RegistrationValidator.validate_capacity(event)
    RegistrationValidator.validate_event_visibility(event)

    payment_data = data.pop("payment", None)
    RegistrationValidator.validate_payment_evidence(event, payment_data)

    student = data.pop("student", None)
    if student:
        registration = _register_student(event, student, data, actor)
    else:
        registration = _register_public(event, data, actor)

    if payment_data:
        from apps.events.services.event_payment_service import submit_payment_evidence

        submit_payment_evidence(
            registration=registration,
            amount=payment_data.get("amount"),
            payment_method=payment_data.get("payment_method"),
            transaction_reference=payment_data.get("transaction_reference", ""),
            bank_name=payment_data.get("bank_name", ""),
            attachment=payment_data.get("attachment"),
            actor=actor,
        )

    return registration


def _register_student(event, student, data: dict, actor=None) -> EventRegistration:
    """
    Register an authenticated student for an event.

    Args:
        event: Event instance.
        student: Student UUID or Student instance.
        data: Additional data (unused for student registration).
        actor: Optional User performing the action.

    Returns:
        EventRegistration instance.
    """
    RegistrationValidator.validate_student_registration(event)

    if not isinstance(student, Student):
        try:
            student = Student.objects.select_related("user").get(id=student)
        except Student.DoesNotExist:
            raise NotFound("Student not found.")

    RegistrationValidator.validate_duplicate(event, student=student)

    with transaction.atomic():
        registration = EventRegistration.objects.create(
            event=event,
            student=student,
            registration_status=RegistrationStatus.PENDING,
        )
        log_action(actor, "CREATE_REGISTRATION", registration, registration.id)
        return registration


def _register_public(event, data: dict, actor=None) -> EventRegistration:
    """
    Register a public (unauthenticated) participant for an event.

    Args:
        event: Event instance.
        data: Dictionary with 'public_full_name', 'public_email',
              'public_phone', optional 'public_organization'.
        actor: Optional User performing the action.

    Returns:
        EventRegistration instance.
    """
    RegistrationValidator.validate_public_registration(event)

    public_full_name = data.get("public_full_name")
    public_email = data.get("public_email")
    public_phone = data.get("public_phone")

    if not public_full_name:
        raise ValidationError("Full name is required for public registration.")
    if not public_email:
        raise ValidationError("Email is required for public registration.")
    if not public_phone:
        raise ValidationError("Phone number is required for public registration.")

    RegistrationValidator.validate_duplicate(event, public_email=public_email)

    with transaction.atomic():
        registration = EventRegistration.objects.create(
            event=event,
            public_full_name=public_full_name,
            public_email=public_email,
            public_phone=public_phone,
            public_organization=data.get("public_organization"),
            registration_status=RegistrationStatus.PENDING,
        )
        log_action(actor, "CREATE_REGISTRATION", registration, registration.id)
        return registration


def approve_registration(registration: EventRegistration, actor=None) -> EventRegistration:
    """
    Approve a pending registration.

    Args:
        registration: EventRegistration instance.
        actor: Optional User performing the action.

    Returns:
        Updated EventRegistration instance.

    Raises:
        ValidationError: If registration is not in PENDING status,
                         or if payment is required but not verified.
    """
    from django.utils import timezone

    if registration.registration_status != RegistrationStatus.PENDING:
        raise ValidationError(
            f"Cannot approve a registration with status '{registration.registration_status}'."
        )

    if registration.event.payment_required:
        if registration.payment_status != PaymentStatus.VERIFIED:
            raise ValidationError(
                "Cannot approve a registration with unverified payment. "
                "Please verify the payment first using the verify-payment endpoint."
            )

    RegistrationValidator.validate_capacity(registration.event)

    with transaction.atomic():
        registration.registration_status = RegistrationStatus.APPROVED
        registration.approved_at = timezone.now()
        registration.save(update_fields=["registration_status", "approved_at", "updated_at"])

        registration.event.enrolled_count += 1
        registration.event.save(update_fields=["enrolled_count"])

        log_action(actor, "APPROVE_REGISTRATION", registration, registration.id)
        return registration


def reject_registration(registration: EventRegistration, actor=None) -> EventRegistration:
    """
    Reject a pending registration.

    Args:
        registration: EventRegistration instance.
        actor: Optional User performing the action.

    Returns:
        Updated EventRegistration instance.

    Raises:
        ValidationError: If registration is not in PENDING status
                         or payment is already verified.
    """
    if registration.registration_status != RegistrationStatus.PENDING:
        raise ValidationError(
            f"Cannot reject a registration with status '{registration.registration_status}'."
        )

    if registration.payment_status == PaymentStatus.VERIFIED:
        raise ValidationError(
            "Cannot reject a registration with a verified payment. "
            "Please process a refund externally and cancel the payment first."
        )

    with transaction.atomic():
        registration.registration_status = RegistrationStatus.REJECTED
        registration.save(update_fields=["registration_status", "updated_at"])
        log_action(actor, "REJECT_REGISTRATION", registration, registration.id)
        return registration


def cancel_registration(registration: EventRegistration, actor=None) -> EventRegistration:
    """
    Cancel an existing registration.

    Args:
        registration: EventRegistration instance.
        actor: Optional User performing the action.

    Returns:
        Updated EventRegistration instance.

    Raises:
        ValidationError: If registration is already cancelled.
    """
    from django.utils import timezone

    if registration.registration_status == RegistrationStatus.CANCELLED:
        raise ValidationError("Registration is already cancelled.")

    with transaction.atomic():
        was_approved = registration.registration_status == RegistrationStatus.APPROVED

        registration.registration_status = RegistrationStatus.CANCELLED
        registration.cancelled_at = timezone.now()
        registration.save(update_fields=["registration_status", "cancelled_at", "updated_at"])

        if was_approved:
            registration.event.enrolled_count = max(0, registration.event.enrolled_count - 1)
            registration.event.save(update_fields=["enrolled_count"])

        log_action(actor, "CANCEL_REGISTRATION", registration, registration.id)
        return registration


def convert_registration_to_team(
    registration: EventRegistration, team_name: str, actor=None
) -> TournamentTeam:
    """
    Convert an approved registration into a TournamentTeam.

    Args:
        registration: EventRegistration instance (must be APPROVED).
        team_name: Name for the new team.
        actor: Optional User performing the action.

    Returns:
        Created TournamentTeam instance.

    Raises:
        ValidationError: If registration is not APPROVED, event is not a
                         tournament, or a team already exists for this registration.
        NotFound: If tournament not found.
    """
    if registration.registration_status != RegistrationStatus.APPROVED:
        raise ValidationError(
            "Only approved registrations can be converted to tournament teams."
        )
    if registration.event.event_type != EventType.TOURNAMENT:
        raise ValidationError("Registration must be for a tournament event.")

    if registration.tournament_teams.exists():
        raise ValidationError("This registration has already been converted to a team.")

    try:
        tournament = Tournament.objects.get(event=registration.event)
    except Tournament.DoesNotExist:
        raise NotFound("Tournament not found for this event.")

    TournamentTeamValidator.validate_tournament_not_closed(tournament)
    TournamentTeamValidator.validate_unique_name(tournament.id, team_name)
    TournamentTeamValidator.validate_max_teams(tournament)

    with transaction.atomic():
        team = TournamentTeam.objects.create(
            tournament=tournament,
            registration=registration,
            team_name=team_name,
        )
        log_action(actor, "CONVERT_REGISTRATION_TO_TEAM", team, team.id)
        return team


def get_my_registrations(student_id):
    """
    Return registrations for a specific student.

    Args:
        student_id: Student UUID.

    Returns:
        QuerySet of EventRegistration objects.
    """
    return list_registrations(student_id=student_id)
