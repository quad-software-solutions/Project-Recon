import uuid

from django.db import models

from apps.events.constants import PaymentStatus, RegistrationStatus


class EventRegistration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="registrations",
        db_index=True,
    )
    student = models.ForeignKey(
        "academic.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="event_registrations",
        db_index=True,
    )
    public_full_name = models.CharField(max_length=255, null=True, blank=True)
    public_email = models.EmailField(null=True, blank=True, db_index=True)
    public_phone = models.CharField(max_length=50, null=True, blank=True)
    public_organization = models.CharField(max_length=255, null=True, blank=True)
    registration_status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
        db_index=True,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING_VERIFICATION,
        db_index=True,
    )
    registered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_event_registration"
        ordering = ["-registered_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "student"],
                name="uq_event_student_registration",
            ),
            models.UniqueConstraint(
                fields=["event", "public_email"],
                name="uq_event_public_email_registration",
            ),
        ]
        indexes = [
            models.Index(fields=["event", "registration_status"]),
            models.Index(fields=["event", "payment_status"]),
        ]

    def __str__(self):
        if self.student:
            return f"{self.event.title} - {self.student.user.email} ({self.registration_status})"
        return f"{self.event.title} - {self.public_email} ({self.registration_status})"
