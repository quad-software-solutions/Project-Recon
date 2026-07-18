"""Service layer for Gallery CRUD operations.

Contains all business logic for managing gallery items, including audit
logging via the shared audit service.
"""

from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.cms.models import Gallery
from apps.shared.audit.services import log_action


def get_gallery_or_404(pk, active_only=False):
    """Retrieve a gallery item by primary key or raise 404.

    Args:
        pk: UUID of the gallery item.
        active_only: If True, only return active items.

    Returns:
        Gallery instance.

    Raises:
        NotFound: If no gallery item exists with the given id.
    """
    qs = Gallery.objects.filter(is_active=True) if active_only else Gallery.objects.all()
    try:
        return qs.get(id=pk)
    except Gallery.DoesNotExist:
        raise NotFound("Gallery item not found.")


def list_gallery_items():
    """Return all gallery items (admin view, includes inactive)."""
    return Gallery.objects.all()


def list_active_gallery_items():
    """Return only active gallery items (public view)."""
    return Gallery.objects.filter(is_active=True)


def _validate_media_present(data: dict):
    image = data.get("image")
    video_url = data.get("video_url")
    if not image and not video_url:
        raise ValidationError("Either image or video_url must be provided.")


def create_gallery_item(data: dict, actor=None) -> Gallery:
    _validate_media_present(data)
    with transaction.atomic():
        item = Gallery.objects.create(**data)
        log_action(actor, "CREATE_GALLERY", "Gallery", item.id)
        return item


def update_gallery_item(item: Gallery, data: dict, actor=None) -> Gallery:
    _validate_media_present_on_update(item, data)
    with transaction.atomic():
        for key, value in data.items():
            setattr(item, key, value)
        item.save(update_fields=list(data.keys()))
    log_action(actor, "UPDATE_GALLERY", "Gallery", item.id)
    return item


def _validate_media_present_on_update(item: Gallery, data: dict):
    if "image" not in data and "video_url" not in data:
        return
    image = data["image"] if "image" in data else item.image
    video_url = data["video_url"] if "video_url" in data else item.video_url
    if not image and not video_url:
        raise ValidationError("Either image or video_url must be provided.")


def delete_gallery_item(item: Gallery, actor=None) -> None:
    """Permanently delete a gallery item.

    Args:
        item: The gallery instance to delete.
        actor: The authenticated user performing the deletion.
    """
    with transaction.atomic():
        log_action(actor, "DELETE_GALLERY", "Gallery", item.id)
        item.delete()
