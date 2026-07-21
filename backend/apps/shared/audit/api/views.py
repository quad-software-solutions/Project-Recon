"""Read-only viewset for the AuditLog API.

Provides paginated, filterable list and detail endpoints restricted
to Super Admin users.
"""

from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from apps.shared.audit.models.audit_log import AuditLog
from apps.shared.audit.api.serializers import AuditLogSerializer
from apps.shared.audit.api.permissions import IsSuperAdmin


@extend_schema_view(
    list=extend_schema(
        summary="List audit log entries",
        description=(
            "Return a paginated list of audit log entries. "
            "Supports filtering by actor, action, resource_type, "
            "resource_id, branch, and created_at date range."
        ),
        tags=["Audit"],
        parameters=[
            OpenApiParameter(
                name="actor",
                description="Filter by actor UUID.",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="action",
                description="Filter by action label (e.g. CREATE, LOGIN).",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="resource_type",
                description="Filter by resource type string.",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="resource_id",
                description="Filter by resource UUID.",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="branch",
                description="Filter by branch UUID.",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="created_after",
                description="Filter records created on or after this ISO 8601 datetime.",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="created_before",
                description="Filter records created on or before this ISO 8601 datetime.",
                required=False,
                type=str,
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Retrieve a single audit log entry",
        description="Return the full audit log record for the given UUID.",
        tags=["Audit"],
    ),
)
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for browsing the platform audit trail.

    * ``GET /api/v1/audit/`` — paginated list with query-parameter filters.
    * ``GET /api/v1/audit/{id}/`` — single record detail.

    Access is restricted to Super Admin users only.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    lookup_field = "id"
    throttle_scope = "shared_audit"

    def get_queryset(self):
        """Return the filtered AuditLog queryset.

        Applies optional query-parameter filters for actor, action,
        resource_type, resource_id, branch, and created_at date range.

        Returns:
            Filtered ``AuditLog`` queryset with ``select_related`` on
            ``actor`` and ``branch``.
        """
        qs = AuditLog.objects.select_related("actor", "branch").all()

        params = self.request.query_params

        actor = params.get("actor")
        if actor:
            qs = qs.filter(actor_id=actor)

        action = params.get("action")
        if action:
            qs = qs.filter(action=action)

        resource_type = params.get("resource_type")
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        resource_id = params.get("resource_id")
        if resource_id:
            qs = qs.filter(resource_id=resource_id)

        branch = params.get("branch")
        if branch:
            qs = qs.filter(branch_id=branch)

        created_after = params.get("created_after")
        if created_after:
            qs = qs.filter(created_at__gte=created_after)

        created_before = params.get("created_before")
        if created_before:
            qs = qs.filter(created_at__lte=created_before)

        return qs
