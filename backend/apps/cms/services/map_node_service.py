"""Service layer for MapNode CRUD operations.

Contains all business logic for managing journey map nodes.
"""

from django.db import transaction
from rest_framework.exceptions import NotFound

from apps.cms.models import MapNode
from apps.shared.audit.services import log_action


def get_map_node_or_404(pk):
    """Retrieve a map node by primary key or raise 404.

    Args:
        pk: UUID of the map node.

    Returns:
        MapNode instance.

    Raises:
        NotFound: If no map node exists with the given id.
    """
    try:
        return MapNode.objects.get(id=pk)
    except MapNode.DoesNotExist:
        raise NotFound("Map node not found.")


def list_map_nodes():
    """Return all map nodes (admin view, includes inactive)."""
    return MapNode.objects.all()


def list_active_map_nodes():
    """Return only active map nodes (public view)."""
    return MapNode.objects.filter(is_active=True)


def create_map_node(data: dict, actor=None) -> MapNode:
    """Create a new map node.

    Args:
        data: Validated dictionary of field values.
        actor: The authenticated user creating the node.

    Returns:
        The newly created MapNode instance.
    """
    with transaction.atomic():
        node = MapNode.objects.create(**data)
        log_action(actor, "CREATE_MAP_NODE", "MapNode", node.id)
        return node


def update_map_node(node: MapNode, data: dict, actor=None) -> MapNode:
    """Update an existing map node (partial update).

    Args:
        node: The map node instance to update.
        data: Validated dictionary of field values to update.
        actor: The authenticated user performing the update.

    Returns:
        The updated MapNode instance.
    """
    with transaction.atomic():
        for key, value in data.items():
            setattr(node, key, value)
        node.save(update_fields=list(data.keys()))

    log_action(actor, "UPDATE_MAP_NODE", "MapNode", node.id)
    return node


def delete_map_node(node: MapNode, actor=None) -> None:
    """Soft-delete a map node by setting is_active to False.

    Args:
        node: The map node instance to delete.
        actor: The authenticated user performing the deletion.
    """
    with transaction.atomic():
        log_action(actor, "DELETE_MAP_NODE", "MapNode", node.id)
        node.is_active = False
        node.save(update_fields=["is_active"])
