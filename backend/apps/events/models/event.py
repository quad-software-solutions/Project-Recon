import uuid

from django.db import models

from apps.events.constants import EventStatus, EventType, Visibility, RegistrationMode


def event_banner_upload_to(instance, filename):
    return f"events/banners/{uuid.uuid4().hex}/{filename}"


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        "accounts.Branch",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="events",
        db_index=True,
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    banner = models.ImageField(upload_to=event_banner_upload_to, null=True, blank=True)
    location = models.CharField(max_length=255)
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.GENERAL,
        db_index=True,
    )
    start_datetime = models.DateTimeField(db_index=True)
    end_datetime = models.DateTimeField(db_index=True)
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.DRAFT,
        db_index=True,
    )
    registration_enabled = models.BooleanField(default=False)
    registration_mode = models.CharField(
        max_length=20,
        choices=RegistrationMode.choices,
        null=True,
        blank=True,
    )
    registration_deadline = models.DateTimeField(null=True, blank=True)
    payment_required = models.BooleanField(default=False)
    registration_fee = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    capacity = models.PositiveIntegerField(null=True, blank=True)
    enrolled_count = models.PositiveIntegerField(default=0)
    youtube_live_url = models.URLField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events_event"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "visibility"]),
            models.Index(fields=["status", "visibility", "is_active"]),
            models.Index(fields=["branch", "start_datetime"]),
            models.Index(fields=["branch", "status"]),
        ]

    def __str__(self):
        return self.title
