import uuid

from django.db import models

from apps.academic.constants import ClassPeriod, ClassType


class EnrollmentPeriod(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT, related_name="enrollment_periods"
    )
    program = models.ForeignKey(
        "academic.Program", on_delete=models.PROTECT, related_name="enrollment_periods"
    )
    sub_program = models.ForeignKey(
        "academic.SubProgram", on_delete=models.PROTECT, related_name="enrollment_periods"
    )
    class_type = models.CharField(max_length=10, choices=ClassType.choices, db_index=True)
    class_period = models.CharField(max_length=10, choices=ClassPeriod.choices, null=True, blank=True)
    title = models.CharField(max_length=255)
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Enrollment Period"
        verbose_name_plural = "Enrollment Periods"

    def __str__(self):
        return self.title

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("start_date must be before end_date.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
