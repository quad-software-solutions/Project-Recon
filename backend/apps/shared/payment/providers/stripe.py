"""Stripe payment provider stub.

This provider exists so that setting ``PAYMENT_PROVIDER=stripe`` does
not break the application, but the actual Stripe integration is not yet
implemented.  All methods raise ``NotImplementedError``.

Money values use ``Decimal`` in the interface signature to stay
consistent with the base class contract, even though the methods are
not implemented.
"""

from decimal import Decimal
from typing import Optional

from apps.shared.payment.providers.base import BasePaymentProvider
from apps.shared.payment.types import InitializationResponse, VerificationResponse


class StripePaymentProvider(BasePaymentProvider):
    """Stub Stripe provider — not yet implemented.

    Satisfies the ``BasePaymentProvider`` interface so that the
    ``PaymentService`` can instantiate it without errors, but all
    operations raise ``NotImplementedError``.
    """

    def initialize(
        self,
        amount: Decimal,
        currency: str,
        reference: str,
        callback_url: str,
        customer: dict,
        return_url: Optional[str] = None,
    ) -> InitializationResponse:
        """Raise NotImplementedError — Stripe is not yet integrated.

        Args:
            amount: Payment amount as a ``Decimal``.
            currency: ISO 4217 currency code.
            reference: Unique transaction reference.
            callback_url: Server-to-server notification URL.
            customer: Customer details dict.
            return_url: Optional browser redirect URL.

        Raises:
            NotImplementedError: Always.
        """
        raise NotImplementedError(
            "Stripe payment provider is not yet implemented. "
            "Set PAYMENT_PROVIDER=chapa to use an active provider."
        )

    def verify(self, reference: str) -> VerificationResponse:
        """Raise NotImplementedError — Stripe is not yet integrated.

        Args:
            reference: The transaction reference to verify.

        Raises:
            NotImplementedError: Always.
        """
        raise NotImplementedError(
            "Stripe payment provider is not yet implemented. "
            "Set PAYMENT_PROVIDER=chapa to use an active provider."
        )
