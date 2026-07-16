import uuid

from django.db import models

from apps.academic.constants import EnrollmentStatus, VerificationStatus


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "academic.Student", on_delete=models.PROTECT, related_name="enrollments"
    )
    enrolled_class = models.ForeignKey(
        "academic.Class", on_delete=models.PROTECT, related_name="enrollments"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.PENDING_VERIFICATION,
        db_index=True,
    )
    enrollment_number = models.CharField(
        max_length=50, unique=True, null=True, blank=True, db_index=True
    )
    pending_code = models.CharField(
        max_length=50, unique=True, null=True, blank=True, db_index=True
    )
    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, null=True, blank=True
    )
    rejection_reason = models.TextField(blank=True, default="")
    transferred_from = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="transferred_to_enrollments",
    )
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-enrolled_at"]
        verbose_name = "Enrollment"
        verbose_name_plural = "Enrollments"
        constraints = [
            models.UniqueConstraint(
                fields=["student", "enrolled_class"],
                name="unique_active_enrollment_per_student_class",
            )
        ]

    def __str__(self):
        return f"{self.student} → {self.enrolled_class} ({self.get_status_display()})"
