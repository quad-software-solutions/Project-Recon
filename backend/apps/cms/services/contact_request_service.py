from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.cms.models import ContactRequest
from apps.cms.constants import ContactStatus, ContactPriority
from apps.shared.audit.services import log_action


def get_contact_request_or_404(pk):
    try:
        return ContactRequest.objects.get(id=pk)
    except ContactRequest.DoesNotExist:
        raise NotFound("Contact request not found.")


def list_contact_requests():
    return ContactRequest.objects.all()


def _reject_duplicate(email, subject):
    if not email or not subject:
        return
    cutoff = timezone.now() - timedelta(minutes=5)
    exists = ContactRequest.objects.filter(
        email=email, subject=subject, created_at__gte=cutoff
    ).exists()
    if exists:
        raise ValidationError(
            "A contact request with the same email and subject was "
            "submitted recently. Please wait before submitting again."
        )


def create_contact_request(data: dict, actor=None) -> ContactRequest:
    _reject_duplicate(data.get("email"), data.get("subject"))
    if not data.get("name", "").strip():
        raise ValidationError("Name is required.")
    if not data.get("email", "").strip():
        raise ValidationError("Email is required.")
    if not data.get("subject", "").strip():
        raise ValidationError("Subject is required.")
    if not data.get("description", "").strip():
        raise ValidationError("Description is required.")
    with transaction.atomic():
        request_obj = ContactRequest.objects.create(**data)
        log_action(actor, "CREATE_CONTACT_REQUEST", "ContactRequest", request_obj.id)
        return request_obj


def update_contact_request(
    request_obj: ContactRequest, data: dict, actor=None
) -> ContactRequest:
    allowed_fields = {"status", "priority", "name", "email", "phone", "subject", "description"}
    updates = {k: v for k, v in data.items() if k in allowed_fields}
    if "status" in updates and updates["status"] not in ContactStatus.values:
        raise ValidationError(f"Invalid status: {updates['status']}")
    if "priority" in updates and updates["priority"] not in ContactPriority.values:
        raise ValidationError(f"Invalid priority: {updates['priority']}")
    with transaction.atomic():
        for key, value in updates.items():
            setattr(request_obj, key, value)
        request_obj.save(update_fields=list(updates.keys()))
    log_action(actor, "UPDATE_CONTACT_REQUEST", "ContactRequest", request_obj.id)
    return request_obj


def delete_contact_request(request_obj: ContactRequest, actor=None) -> None:
    with transaction.atomic():
        log_action(actor, "DELETE_CONTACT_REQUEST", "ContactRequest", request_obj.id)
        request_obj.delete()
