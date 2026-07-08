"""Chapa payment provider — fully implemented.

Communicates with `Chapa's API <https://developer.chapa.co/>`_ to
initialise and verify payments.  Normalises all responses into the
provider-agnostic shapes defined in ``types.py`` so business modules
never need to know Chapa's specific response format.

Implementation details:

* Uses a reusable ``requests.Session`` with an ``HTTPAdapter`` and
  ``Retry`` strategy so transient failures (429, 5xx) are retried
  automatically.
* API keys and configuration are read from Django settings — never
  from ``os.environ`` directly.
* Money values use ``Decimal``, never ``float``.
* Business outcomes (pending, failed, etc.) are returned normally;
  only infrastructure failures raise exceptions.
"""

import logging
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

import requests
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from apps.shared.payment.exceptions import (
    PaymentAuthenticationError,
    PaymentConfigurationError,
    PaymentProviderError,
    PaymentRateLimitError,
    PaymentServerError,
)
from apps.shared.payment.providers.base import BasePaymentProvider
from apps.shared.payment.types import InitializationResponse, VerificationResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROVIDER_NAME = "chapa"

DEFAULT_BASE_URL = "https://api.chapa.co/v1"
DEFAULT_TIMEOUT_SECONDS = 30

_RETRY_STATUS_CODES = [429, 500, 502, 503, 504]
_DEFAULT_RETRY_TOTAL = 3
_DEFAULT_RETRY_BACKOFF_FACTOR = 0.5


class ChapaPaymentProvider(BasePaymentProvider):
    """Concrete payment provider for the Chapa payment gateway.

    Creates a ``requests.Session`` once on initialisation and reuses
    it for all HTTP calls.  The session is configured with a retry
    adapter for transient failure codes.

    Attributes:
        _session: Reusable ``requests.Session`` with retry adapter.
        _base_url: Chapa API base URL.
        _timeout: Request timeout in seconds.
    """

    def __init__(self) -> None:
        """Initialise the Chapa provider.

        Reads configuration from Django settings and builds a
        ``requests.Session`` with retry capabilities.

        Raises:
            PaymentConfigurationError: If ``CHAPA_SECRET_KEY`` is not
                configured.
        """
        self._base_url: str = getattr(
            settings, "CHAPA_BASE_URL", DEFAULT_BASE_URL
        )
        self._timeout: int = getattr(
            settings, "CHAPA_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS
        )

        secret_key: str = self._get_secret_key()
        self._session: requests.Session = self._build_session(secret_key)

    # ------------------------------------------------------------------
    # Configuration helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_secret_key() -> str:
        """Read and validate the Chapa secret key from Django settings.

        Returns:
            The configured secret key string.

        Raises:
            PaymentConfigurationError: If the key is missing or empty.
        """
        secret_key: str = getattr(settings, "CHAPA_SECRET_KEY", "")
        if not secret_key:
            raise PaymentConfigurationError(
                "Chapa provider requires CHAPA_SECRET_KEY in Django settings."
            )
        return secret_key

    @staticmethod
    def _build_session(secret_key: str) -> requests.Session:
        """Build a ``requests.Session`` with retry adapter.

        The retry strategy handles transient failures (429, 5xx) with
        exponential back-off.  Only GET requests are retried by default
        (POST is excluded to avoid double-charging).

        Retry settings are read from Django settings with last-resort
        fallback constants defined at the module level.

        Args:
            secret_key: Chapa API secret key for the ``Authorization``
                header.

        Returns:
            Configured ``requests.Session``.
        """
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        })

        retry_total: int = getattr(
            settings, "CHAPA_RETRY_TOTAL", _DEFAULT_RETRY_TOTAL
        )
        retry_backoff: float = getattr(
            settings, "CHAPA_RETRY_BACKOFF_FACTOR", _DEFAULT_RETRY_BACKOFF_FACTOR
        )

        retry_strategy = Retry(
            total=retry_total,
            backoff_factor=retry_backoff,
            status_forcelist=_RETRY_STATUS_CODES,
            allowed_methods=["GET"],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        return session

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def initialize(
        self,
        amount: Decimal,
        currency: str,
        reference: str,
        callback_url: str,
        customer: dict,
        return_url: Optional[str] = None,
    ) -> InitializationResponse:
        """Initialize a Chapa payment transaction.

        Sends a POST request to Chapa's ``/transaction/initialize``
        endpoint and normalises the response.

        Args:
            amount: Payment amount as a ``Decimal``.
            currency: ISO 4217 currency code (e.g. ``"ETB"``).
            reference: Unique transaction reference.
            callback_url: Server-to-server notification URL.
            customer: Dict with ``email`` and optionally
                ``first_name``, ``last_name``, ``phone_number``.
            return_url: Optional browser redirect URL after payment.

        Returns:
            Normalised ``InitializationResponse``.

        Raises:
            PaymentAuthenticationError: On 401/403 responses.
            PaymentRateLimitError: On 429 responses.
            PaymentServerError: On 5xx responses.
            PaymentProviderError: On network errors or malformed JSON.
        """
        logger.info(
            "Chapa initialize: reference=%s amount=%s currency=%s",
            reference,
            amount,
            currency,
        )

        payload = self._build_init_payload(
            amount, currency, reference, callback_url, customer, return_url
        )
        url = f"{self._base_url}/transaction/initialize"

        response = self._make_request("POST", url, json=payload)
        data = self._parse_json(response, context="initialization")
        self._check_http_errors(response, data, context="initialization")

        return self._normalize_init_response(data, reference, amount, currency)

    def verify(self, reference: str) -> VerificationResponse:
        """Verify a Chapa payment by transaction reference.

        Sends a GET request to Chapa's ``/transaction/verify/{ref}``
        endpoint and normalises the response.

        Args:
            reference: The transaction reference to verify.

        Returns:
            Normalised ``VerificationResponse``.

        Raises:
            PaymentAuthenticationError: On 401/403 responses.
            PaymentRateLimitError: On 429 responses.
            PaymentServerError: On 5xx responses.
            PaymentProviderError: On network errors or malformed JSON.
        """
        logger.info("Chapa verify: reference=%s", reference)

        url = f"{self._base_url}/transaction/verify/{reference}"

        response = self._make_request("GET", url)
        data = self._parse_json(response, context="verification")
        self._check_http_errors(response, data, context="verification")

        return self._normalize_verify_response(data, reference)

    # ------------------------------------------------------------------
    # Request helpers
    # ------------------------------------------------------------------

    def _make_request(
        self,
        method: str,
        url: str,
        json: Optional[dict] = None,
    ) -> requests.Response:
        """Execute an HTTP request through the reusable session.

        Args:
            method: HTTP method (``"GET"`` or ``"POST"``).
            url: Full request URL.
            json: Optional JSON payload for POST requests.

        Returns:
            The ``requests.Response`` object.

        Raises:
            PaymentProviderError: On network-level failures (timeout,
                connection error, etc.).
        """
        try:
            response = self._session.request(
                method=method,
                url=url,
                json=json,
                timeout=self._timeout,
            )
        except requests.Timeout as exc:
            logger.error("Chapa request timed out: %s %s", method, url)
            raise PaymentProviderError(
                f"Chapa request timed out: {method} {url}"
            ) from exc
        except requests.ConnectionError as exc:
            logger.error("Chapa connection error: %s %s", method, url)
            raise PaymentProviderError(
                f"Chapa connection error: {method} {url}"
            ) from exc
        except requests.RequestException as exc:
            logger.error("Chapa request failed: %s %s — %s", method, url, exc)
            raise PaymentProviderError(
                f"Chapa request failed: {method} {url} — {exc}"
            ) from exc

        return response

    @staticmethod
    def _parse_json(
        response: requests.Response,
        context: str,
    ) -> dict:
        """Safely parse JSON from a response.

        Args:
            response: The HTTP response to parse.
            context: Human-readable context for error messages
                (e.g. ``"initialization"``, ``"verification"``).

        Returns:
            Parsed JSON as a dict.

        Raises:
            PaymentProviderError: If the response body is not valid JSON.
        """
        try:
            data: Any = response.json()
        except (ValueError, requests.exceptions.JSONDecodeError) as exc:
            logger.error(
                "Chapa %s returned malformed JSON (HTTP %d)",
                context,
                response.status_code,
            )
            raise PaymentProviderError(
                f"Chapa {context} returned malformed JSON "
                f"(HTTP {response.status_code})"
            ) from exc

        if not isinstance(data, dict):
            raise PaymentProviderError(
                f"Chapa {context} returned unexpected JSON type: "
                f"{type(data).__name__}"
            )

        return data

    @staticmethod
    def _check_http_errors(
        response: requests.Response,
        data: dict,
        context: str,
    ) -> None:
        """Map HTTP error codes to specific exception types.

        Args:
            response: The HTTP response to inspect.
            data: Parsed JSON body (used for error messages).
            context: Human-readable context for error messages.

        Raises:
            PaymentAuthenticationError: On 401 or 403.
            PaymentRateLimitError: On 429.
            PaymentServerError: On 5xx.
            PaymentProviderError: On other non-200 responses.
        """
        status = response.status_code

        if 200 <= status < 300:
            return

        message = data.get("message", response.text)

        if status in (401, 403):
            logger.error(
                "Chapa %s authentication failure (HTTP %d): %s",
                context,
                status,
                message,
            )
            raise PaymentAuthenticationError(
                f"Chapa {context} authentication failed (HTTP {status}): "
                f"{message}"
            )

        if status == 429:
            logger.warning(
                "Chapa %s rate limited (HTTP 429): %s",
                context,
                message,
            )
            raise PaymentRateLimitError(
                f"Chapa {context} rate limited (HTTP 429): {message}"
            )

        if status >= 500:
            logger.error(
                "Chapa %s server error (HTTP %d): %s",
                context,
                status,
                message,
            )
            raise PaymentServerError(
                f"Chapa {context} server error (HTTP {status}): {message}"
            )

        logger.error(
            "Chapa %s failed (HTTP %d): %s",
            context,
            status,
            message,
        )
        raise PaymentProviderError(
            f"Chapa {context} failed (HTTP {status}): {message}"
        )

    # ------------------------------------------------------------------
    # Payload builders
    # ------------------------------------------------------------------

    @staticmethod
    def _build_init_payload(
        amount: Decimal,
        currency: str,
        reference: str,
        callback_url: str,
        customer: dict,
        return_url: Optional[str],
    ) -> dict:
        """Build the JSON payload for Chapa's initialisation endpoint.

        Args:
            amount: Payment amount as ``Decimal``.
            currency: ISO 4217 currency code.
            reference: Unique transaction reference.
            callback_url: Server-to-server notification URL.
            customer: Customer details dict.
            return_url: Optional browser redirect URL.

        Returns:
            Dict ready for ``json=`` in a POST request.
        """
        payload: dict = {
            "amount": str(amount),
            "currency": currency,
            "tx_ref": reference,
            "callback_url": callback_url,
            "email": customer.get("email", ""),
            "first_name": customer.get("first_name", ""),
            "last_name": customer.get("last_name", ""),
            "phone_number": customer.get("phone_number", ""),
        }

        if return_url:
            payload["return_url"] = return_url

        return payload

    # ------------------------------------------------------------------
    # Response normalisers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_init_response(
        data: dict,
        reference: str,
        amount: Decimal,
        currency: str,
    ) -> InitializationResponse:
        """Normalise a successful Chapa initialisation response.

        Args:
            data: Parsed JSON from Chapa.
            reference: Original transaction reference.
            amount: Original payment amount.
            currency: Original currency code.

        Returns:
            Normalised ``InitializationResponse``.
        """
        inner: dict = data.get("data", {})

        return InitializationResponse(
            provider=PROVIDER_NAME,
            status=data.get("status", ""),
            provider_status=data.get("status", ""),
            reference=reference,
            provider_transaction_id=inner.get("tx_ref"),
            amount=amount,
            currency=currency,
            checkout_url=inner.get("checkout_url", ""),
            raw=data,
        )

    @staticmethod
    def _normalize_verify_response(
        data: dict,
        reference: str,
    ) -> VerificationResponse:
        """Normalise a successful Chapa verification response.

        Args:
            data: Parsed JSON from Chapa.
            reference: Original transaction reference.

        Returns:
            Normalised ``VerificationResponse``.
        """
        inner: dict = data.get("data", {})

        raw_amount = inner.get("amount")
        amount: Optional[Decimal] = None
        if raw_amount is not None:
            try:
                amount = Decimal(str(raw_amount))
            except (InvalidOperation, TypeError):
                logger.warning(
                    "Chapa verify: could not parse amount=%r as Decimal",
                    raw_amount,
                )

        return VerificationResponse(
            provider=PROVIDER_NAME,
            status=data.get("status", ""),
            provider_status=data.get("status", ""),
            reference=reference,
            provider_transaction_id=inner.get("reference"),
            amount=amount,
            currency=inner.get("currency", ""),
            raw=data,
        )
