import uuid

from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models

from apps.academic.constants import ProgressStatus


class StudentProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        "academic.Enrollment", on_delete=models.PROTECT, related_name="progress_records"
    )
    milestone = models.ForeignKey(
        "academic.LearningMilestone",
        on_delete=models.PROTECT,
        related_name="student_progress",
    )
    status = models.CharField(
        max_length=20,
        choices=ProgressStatus.choices,
        default=ProgressStatus.NOT_STARTED,
        db_index=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, default="", validators=[MaxLengthValidator(2000)])
    updated_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="progress_updates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["milestone__title"]
        verbose_name = "Student Progress"
        verbose_name_plural = "Student Progress Records"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "milestone"],
                name="unique_progress_per_enrollment_milestone",
            )
        ]

    def __str__(self):
        return f"{self.enrollment.student.user.full_name} - {self.milestone.title} ({self.get_status_display()})"

    def clean(self):
        if self.milestone.sub_program != self.enrollment.enrolled_class.sub_program:
            raise ValidationError(
                "Milestone must belong to the same SubProgram as the enrollment's class."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
