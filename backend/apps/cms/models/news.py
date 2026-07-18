import uuid

from django.db import models

from apps.cms.constants import NewsType
from apps.shared.validators import HttpsUrlValidator, UploadedFileValidator


def news_upload_to(instance, filename):
    return f"cms/news/{uuid.uuid4().hex}/{filename}"


class NewsArticle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True, db_index=True)
    summary = models.TextField(blank=True, default="")
    content = models.TextField()
    image = models.ImageField(
        upload_to=news_upload_to, null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    video_url = models.URLField(
        max_length=500, null=True, blank=True,
        validators=[HttpsUrlValidator()],
    )
    button_text = models.CharField(max_length=100, null=True, blank=True)
    button_url = models.URLField(
        max_length=500, null=True, blank=True,
        validators=[HttpsUrlValidator()],
    )
    type = models.CharField(
        max_length=20,
        choices=NewsType.choices,
        default=NewsType.NEWS,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        db_table = "cms_news_article"

    def __str__(self):
        return self.title
