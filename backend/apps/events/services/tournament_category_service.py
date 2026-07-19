from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.models import TournamentCategory
from apps.shared.audit.services import log_action


def get_category_or_404(pk):
    try:
        return TournamentCategory.objects.get(id=pk)
    except TournamentCategory.DoesNotExist:
        raise NotFound("Tournament category not found.")


def list_categories():
    return TournamentCategory.objects.all()


def create_category(data: dict, actor=None) -> TournamentCategory:
    with transaction.atomic():
        category = TournamentCategory.objects.create(**data)
        log_action(actor, "CREATE_TOURNAMENT_CATEGORY", category, category.id)
        return category


def update_category(category: TournamentCategory, data: dict, actor=None) -> TournamentCategory:
    with transaction.atomic():
        for key, value in data.items():
            setattr(category, key, value)
        category.save(update_fields=list(data.keys()))
        log_action(actor, "UPDATE_TOURNAMENT_CATEGORY", category, category.id)
        return category


def delete_category(category: TournamentCategory, actor=None) -> None:
    if category.tournaments.exists():
        raise ValidationError(
            "Cannot delete category that is in use by tournaments."
        )
    with transaction.atomic():
        log_action(
            actor, "DELETE_TOURNAMENT_CATEGORY", "TournamentCategory", category.id,
            details={
                "name": category.name,
                "code": category.code,
            },
        )
        category.delete()
