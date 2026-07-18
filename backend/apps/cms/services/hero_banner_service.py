from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.cms.models import HeroBanner
from apps.shared.audit.services import log_action


def get_hero_banner_or_404(pk):
    try:
        return HeroBanner.objects.get(id=pk)
    except HeroBanner.DoesNotExist:
        raise NotFound("Hero banner not found.")


def list_hero_banners():
    return HeroBanner.objects.all()


def list_active_hero_banners():
    return HeroBanner.objects.filter(is_active=True)


def create_hero_banner(data: dict, actor=None) -> HeroBanner:
    _validate_media_present(data)
    _validate_media_conflict(data)
    _validate_button(data)
    with transaction.atomic():
        banner = HeroBanner.objects.create(**data)
        log_action(actor, "CREATE_HERO_BANNER", "HeroBanner", banner.id)
        return banner


def update_hero_banner(banner: HeroBanner, data: dict, actor=None) -> HeroBanner:
    has_media = bool("image" in data or "video_url" in data)
    if has_media:
        _validate_media_conflict(data)
    _validate_button(data)
    with transaction.atomic():
        for key, value in data.items():
            setattr(banner, key, value)
        banner.save(update_fields=list(data.keys()))
    log_action(actor, "UPDATE_HERO_BANNER", "HeroBanner", banner.id)
    return banner


def delete_hero_banner(banner: HeroBanner, actor=None) -> None:
    with transaction.atomic():
        log_action(actor, "DELETE_HERO_BANNER", "HeroBanner", banner.id)
        banner.delete()


def _validate_media_present(data: dict):
    image = data.get("image")
    video_url = data.get("video_url")
    if not image and not video_url:
        raise ValidationError("Either image or video_url must be provided.")


def _validate_media_conflict(data: dict):
    image = data.get("image")
    video_url = data.get("video_url")
    if image and video_url:
        raise ValidationError(
            "Only one of image or video_url may be provided, not both."
        )


def _validate_button(data: dict):
    button_text = data.get("button_text")
    button_url = data.get("button_url")
    if button_text and not button_url:
        raise ValidationError("button_url is required when button_text is provided.")
    if button_url and not button_text:
        raise ValidationError("button_text is required when button_url is provided.")
