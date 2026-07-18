import uuid

from django.db import models

from apps.cms.constants import PartnerType
from apps.shared.validators import HttpsUrlValidator, UploadedFileValidator


def partner_upload_to(instance, filename):
    return f"cms/partners/{uuid.uuid4().hex}/{filename}"


class Partner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    image = models.ImageField(
        upload_to=partner_upload_to,
        validators=[UploadedFileValidator()],
    )
    website_url = models.URLField(
        max_length=500, null=True, blank=True,
        validators=[HttpsUrlValidator()],
    )
    type = models.CharField(
        max_length=20,
        choices=PartnerType.choices,
        default=PartnerType.PARTNER,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        db_table = "cms_partner"

    def __str__(self):
        return self.title
