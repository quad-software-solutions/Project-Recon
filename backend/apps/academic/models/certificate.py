import os
import uuid

from django.db import models

from apps.shared.validators import sanitize_filename, UploadedFileValidator


def certificate_bg_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    unique = f"{uuid.uuid4().hex}{ext}"
    return f"academic/certificates/bg/{unique}"


def certificate_logo_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    unique = f"{uuid.uuid4().hex}{ext}"
    return f"academic/certificates/logo/{unique}"


def certificate_sig_upload_to(instance, filename):
    safe = sanitize_filename(filename)
    ext = os.path.splitext(safe)[1]
    unique = f"{uuid.uuid4().hex}{ext}"
    return f"academic/certificates/sig/{unique}"


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_program = models.OneToOneField(
        "academic.SubProgram",
        on_delete=models.PROTECT,
        related_name="certificate",
    )
    title = models.CharField(max_length=255)
    background = models.ImageField(
        upload_to=certificate_bg_upload_to,
        validators=[UploadedFileValidator()],
    )
    institute_logo = models.ImageField(
        upload_to=certificate_logo_upload_to,
        validators=[UploadedFileValidator()],
        blank=True, null=True,
    )
    signature = models.ImageField(
        upload_to=certificate_sig_upload_to,
        validators=[UploadedFileValidator()],
        blank=True, null=True,
    )
    body_text = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Certificate Template"
        verbose_name_plural = "Certificate Templates"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["sub_program"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.sub_program.name})"


class StudentCertificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "academic.Student",
        on_delete=models.PROTECT,
        related_name="certificates",
    )
    certificate = models.ForeignKey(
        Certificate,
        on_delete=models.PROTECT,
        related_name="issued",
    )
    sub_program = models.ForeignKey(
        "academic.SubProgram",
        on_delete=models.PROTECT,
        related_name="student_certificates",
    )
    certificate_number = models.CharField(
        max_length=50, unique=True, db_index=True,
    )
    issued_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="issued_certificates",
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student Certificate"
        verbose_name_plural = "Student Certificates"
        ordering = ["-issued_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "sub_program"],
                name="unique_student_sub_program_cert",
            ),
        ]
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["certificate"]),
            models.Index(fields=["sub_program"]),
            models.Index(fields=["certificate_number"]),
        ]

    def __str__(self):
        return f"{self.certificate_number} — {self.student.user.full_name}"
