import uuid

from django.db import models


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "accounts.User", on_delete=models.PROTECT, related_name="academic_profile"
    )
    branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT, related_name="students"
    )
    date_joined = models.DateField(db_index=True)
    guardian_name = models.CharField(max_length=255, blank=True, default="")
    guardian_phone = models.CharField(max_length=20, blank=True, default="")
    guardian_email = models.EmailField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Student"
        verbose_name_plural = "Students"

    def __str__(self):
        return f"{self.user.full_name} ({self.user.email})"

    def clean(self):
        from django.core.exceptions import ValidationError

        if not self.date_joined:
            raise ValidationError({"date_joined": "Admission date is required."})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
