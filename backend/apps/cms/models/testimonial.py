import uuid

from django.db import models

from apps.shared.validators import HttpsUrlValidator


class Testimonial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=100, help_text="e.g. Parent, Student, Partner")
    quote = models.TextField()
    image = models.URLField(
        max_length=500, null=True, blank=True, validators=[HttpsUrlValidator()],
    )
    video_url = models.URLField(
        max_length=500, null=True, blank=True, validators=[HttpsUrlValidator()],
    )
    is_active = models.BooleanField(default=True, db_index=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        db_table = "cms_testimonial"

    def __str__(self):
        return self.name[:100]
