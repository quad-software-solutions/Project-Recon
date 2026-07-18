import uuid

from django.db import models

from apps.cms.constants import ContactStatus, ContactPriority


def generate_ticket_number():
    return f"CR-{uuid.uuid4().hex[:8].upper()}"


def contact_request_upload_to(instance, filename):
    return f"cms/contact_requests/{uuid.uuid4().hex}/{filename}"


class ContactRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(
        max_length=20, unique=True, db_index=True, default=generate_ticket_number
    )
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    subject = models.CharField(max_length=300)
    description = models.TextField()
    attachment = models.FileField(
        upload_to=contact_request_upload_to, null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=ContactStatus.choices,
        default=ContactStatus.OPEN,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=ContactPriority.choices,
        default=ContactPriority.MEDIUM,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "cms_contact_request"

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"
