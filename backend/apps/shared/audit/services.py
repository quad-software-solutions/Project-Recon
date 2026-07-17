"""AuditService — centralised audit record creation.

Provides a single ``log_action()`` entry-point for business modules to
record auditable events. The action string is caller-defined — there is
no predefined enum.
"""

SENSITIVE_KEYS = {"password", "new_password", "current_password",
                  "otp", "token", "secret", "refresh", "access",
                  "transaction_reference", "bank_account"}

from apps.shared.audit.models.audit_log import AuditLog


def _sanitise_details(details: dict | None) -> dict | None:
    """Strip sensitive keys from the details dict before persisting."""
    if not details:
        return details
    return {k: v for k, v in details.items()
            if k.lower() not in SENSITIVE_KEYS}


def log_action(
    actor,
    action: str,
    resource_type: str,
    resource_id,
    branch=None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    """Create a new immutable audit record.

    Args:
        actor: The authenticated user performing the action, or ``None``
            for system-initiated events.
        action: Free-form action label provided by the calling service
            (e.g. ``"user.created"``, ``"branch.archived"``).
        resource_type: Plain-text label for the affected entity
            (e.g. ``"User"``, ``"Branch"``).
        resource_id: UUID of the affected resource.
        branch: Optional ``Branch`` instance associated with the action.
        ip_address: Optional client IP address.
        user_agent: Optional HTTP User-Agent string.

    Returns:
        The newly created ``AuditLog`` instance.
    """
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        branch=branch,
        ip_address=ip_address,
        user_agent=user_agent,
        details=_sanitise_details(details),
    )
