"""Payment domain exceptions.

Provides a structured exception hierarchy for payment infrastructure
errors.  Only *infrastructure* problems (network failures, invalid API
keys, malformed JSON, configuration issues, server errors) raise
exceptions.  Business outcomes (pending, failed, cancelled, declined,
expired) are returned as normal response values — never as exceptions.

Hierarchy::

    PaymentError
    ├── PaymentConfigurationError
    └── PaymentProviderError
        ├── PaymentAuthenticationError
        ├── PaymentRateLimitError
        └── PaymentServerError
"""


class PaymentError(Exception):
    """Base exception for all payment-related infrastructure failures.

    Business modules can catch this to handle any payment problem in a
    single except clause when granular handling is unnecessary.
    """


class PaymentConfigurationError(PaymentError):
    """Raised when required payment configuration is missing or invalid.

    Examples:
        - ``CHAPA_SECRET_KEY`` not set.
        - ``PAYMENT_PROVIDER`` set to an unknown value.
    """


class PaymentProviderError(PaymentError):
    """Raised when a payment provider request fails due to infrastructure.

    Covers network errors, malformed JSON, unexpected HTTP responses, and
    other non-business failures returned by a payment gateway.
    """


class PaymentAuthenticationError(PaymentProviderError):
    """Raised when the provider rejects API credentials.

    Typically triggered by an HTTP 401 or 403 response from the payment
    gateway, indicating that the configured API key is invalid or
    revoked.
    """


class PaymentRateLimitError(PaymentProviderError):
    """Raised when the provider enforces a rate limit.

    Triggered by an HTTP 429 (Too Many Requests) response.  Callers
    should back off and retry after the provider-specified interval.
    """


class PaymentServerError(PaymentProviderError):
    """Raised when the provider returns a 5xx server error.

    Indicates a transient problem on the payment gateway side.
    Retry logic in the HTTP adapter handles most of these transparently,
    but this exception surfaces when retries are exhausted.
    """
