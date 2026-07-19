from django.db import transaction
from rest_framework.exceptions import NotFound

from apps.cms.models import Testimonial
from apps.shared.audit.services import log_action


def get_testimonial_or_404(pk, active_only=False):
    """Retrieve a testimonial by PK or raise NotFound.

    Args:
        pk: UUID of the testimonial.
        active_only: If True, only return active items.

    Raises:
        NotFound: If no testimonial exists with the given id.
    """
    qs = Testimonial.objects.filter(is_active=True) if active_only else Testimonial.objects.all()
    try:
        return qs.get(id=pk)
    except Testimonial.DoesNotExist:
        raise NotFound("Testimonial not found.")


def list_testimonials():
    """Return all testimonials (including inactive)."""
    return Testimonial.objects.all()


def list_active_testimonials():
    """Return only active testimonials, ordered by the order field."""
    return Testimonial.objects.filter(is_active=True)


def create_testimonial(data: dict, actor=None) -> Testimonial:
    """Create a new testimonial and audit the action."""
    with transaction.atomic():
        testimonial = Testimonial.objects.create(**data)
        log_action(actor, "CREATE_TESTIMONIAL", testimonial, testimonial.id)
        return testimonial


def update_testimonial(testimonial: Testimonial, data: dict, actor=None) -> Testimonial:
    """Update a testimonial with the given data and audit the action."""
    with transaction.atomic():
        for key, value in data.items():
            setattr(testimonial, key, value)
        testimonial.save(update_fields=list(data.keys()))
    log_action(actor, "UPDATE_TESTIMONIAL", testimonial, testimonial.id)
    return testimonial


def delete_testimonial(testimonial: Testimonial, actor=None) -> None:
    """Delete a testimonial and audit the action."""
    with transaction.atomic():
        log_action(actor, "DELETE_TESTIMONIAL", testimonial, testimonial.id)
        testimonial.delete()
