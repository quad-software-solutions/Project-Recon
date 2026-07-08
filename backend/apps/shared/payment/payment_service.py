"""PaymentService — unified payment interface.

Selects the configured provider from ``settings.PAYMENT_PROVIDER`` using
a simple if/elif lookup (no registry pattern, no factory abstraction)
and delegates initialisation and verification.

The service **never** creates or updates business records — it only
reports what the provider said.  Business services interpret the result
and decide what to do.

Responsibilities:

* Read ``settings.PAYMENT_PROVIDER``.
* Instantiate the correct provider.
* Delegate ``initialize``.
* Delegate ``verify``.

Nothing else.
"""

import logging
from decimal import Decimal
from typing import Optional

from django.conf import settings

from apps.shared.payment.exceptions import PaymentConfigurationError
from apps.shared.payment.providers.base import BasePaymentProvider
from apps.shared.payment.types import InitializationResponse, VerificationResponse
from apps.shared.audit.services import log_action

def initialize_payment(
    amount: Decimal,
    currency: str,
    reference: str,
    callback_url: str,
    customer: dict,
    return_url: Optional[str] = None,
) -> InitializationResponse:
    """Initialize a payment through the active provider.

    The provider is determined by ``settings.PAYMENT_PROVIDER``.

    Args:
        amount: Payment amount as a ``Decimal``.
        currency: ISO 4217 currency code (e.g. ``"ETB"``).
        reference: Unique transaction reference.
        callback_url: Server-to-server URL for the provider to
            notify on payment completion.
        customer: Dict with at least ``email`` and optionally
            ``first_name``, ``last_name``, ``phone_number``.
        return_url: Optional browser redirect URL after the user
            completes payment.

    Returns:
        Normalised ``InitializationResponse`` dict.

    Raises:
        PaymentConfigurationError: If the provider key is unknown.
        PaymentProviderError: If the provider encounters an
            infrastructure failure.
    """

    provider = _get_provider()
    return provider.initialize(
        amount=amount,
        currency=currency,
        reference=reference,
        callback_url=callback_url,
        customer=customer,
        return_url=return_url,
    )


def verify_payment(reference: str) -> VerificationResponse:
    """Verify a payment through the active provider.

    Args:
        reference: The transaction reference to verify.

    Returns:
        Normalised ``VerificationResponse`` dict.

    Raises:
        PaymentConfigurationError: If the provider key is unknown.
        PaymentProviderError: If the provider encounters an
            infrastructure failure.
    """

    provider = _get_provider()
    return provider.verify(reference)


def _get_provider() -> BasePaymentProvider:
    """Return the concrete provider instance based on settings.

    Uses a simple if/elif lookup — no registry, no factory.

    Returns:
        An instance of the configured payment provider.

    Raises:
        PaymentConfigurationError: If the provider key is unknown.
    """
    provider: str = getattr(settings, "PAYMENT_PROVIDER", "chapa")

    if provider == "chapa":
        from apps.shared.payment.providers.chapa import ChapaPaymentProvider

        return ChapaPaymentProvider()
    elif provider == "stripe":
        from apps.shared.payment.providers.stripe import StripePaymentProvider

        return StripePaymentProvider()
    else:
        raise PaymentConfigurationError(
            f"Unknown payment provider: '{provider}'. "
            f"Set PAYMENT_PROVIDER to one of: chapa, stripe."
        )
