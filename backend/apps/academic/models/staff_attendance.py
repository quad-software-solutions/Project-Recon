import uuid

from django.db import models

from apps.academic.constants import AttendanceStatus, SessionStatus


class StaffAttendanceSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT, related_name="staff_attendance_sessions"
    )
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=10, choices=SessionStatus.choices, default=SessionStatus.DRAFT, db_index=True)
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="created_attendance_sessions"
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Staff Attendance Session"
        verbose_name_plural = "Staff Attendance Sessions"

    def __str__(self):
        return f"{self.branch.name} — {self.date} ({self.status})"


class StaffAttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        StaffAttendanceSession, on_delete=models.CASCADE, related_name="records"
    )
    staff_member = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="attendance_records"
    )
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices, db_index=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["staff_member__first_name", "staff_member__last_name"]
        verbose_name = "Staff Attendance Record"
        verbose_name_plural = "Staff Attendance Records"
        constraints = [
            models.UniqueConstraint(
                fields=["session", "staff_member"],
                name="unique_staff_attendance_per_session",
            )
        ]

    def __str__(self):
        return f"{self.staff_member.full_name} — {self.get_status_display()}"
