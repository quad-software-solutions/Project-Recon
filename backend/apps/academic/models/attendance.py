import uuid

from django.core.validators import MaxLengthValidator
from django.db import models

from apps.academic.constants import AttendanceStatus


class AttendanceSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrolled_class = models.ForeignKey(
        "academic.Class", on_delete=models.PROTECT, related_name="attendance_sessions"
    )
    session_date = models.DateField()
    topic = models.CharField(max_length=255, blank=True, default="")
    recorded_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="recorded_attendance_sessions"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-session_date", "-created_at"]
        verbose_name = "Attendance Session"
        verbose_name_plural = "Attendance Sessions"
        constraints = [
            models.UniqueConstraint(
                fields=["enrolled_class", "session_date"],
                name="unique_attendance_session_per_class_per_day",
            )
        ]
        indexes = [
            models.Index(fields=["enrolled_class"]),
            models.Index(fields=["session_date"]),
            models.Index(fields=["recorded_by"]),
        ]

    def __str__(self):
        return f"{self.enrolled_class.name} — {self.session_date}"


class AttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance_session = models.ForeignKey(
        AttendanceSession, on_delete=models.PROTECT, related_name="records"
    )
    enrollment = models.ForeignKey(
        "academic.Enrollment", on_delete=models.PROTECT, related_name="attendance_records"
    )
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices)
    remarks = models.TextField(blank=True, default="", validators=[MaxLengthValidator(2000)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"
        constraints = [
            models.UniqueConstraint(
                fields=["attendance_session", "enrollment"],
                name="unique_attendance_record_per_session_per_enrollment",
            )
        ]
        indexes = [
            models.Index(fields=["attendance_session"]),
            models.Index(fields=["enrollment"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.enrollment.student.user.full_name} — {self.get_status_display()}"
