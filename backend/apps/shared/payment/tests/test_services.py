"""Unit tests for PaymentService.

Tests that:
- initialize_payment() and verify_payment() return the normalised shape.
- PaymentProviderError / PaymentConfigurationError are raised on
  HTTP failure, bad response, or missing configuration.
- Provider selection respects settings.PAYMENT_PROVIDER override.
- Stripe stub raises NotImplementedError.
- Chapa provider uses requests.Session (not raw requests.post/get).
"""

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from apps.shared.payment.payment_service import initialize_payment, verify_payment
from apps.shared.payment.exceptions import (
    PaymentAuthenticationError,
    PaymentConfigurationError,
    PaymentProviderError,
    PaymentServerError,
)


class PaymentServiceProviderSelectionTests(TestCase):
    """Verify that PaymentService selects the correct provider."""

    @override_settings(PAYMENT_PROVIDER="unknown_provider")
    def test_unknown_provider_raises_error(self):
        """initialize_payment() raises PaymentConfigurationError for unknown providers."""
        with self.assertRaises(PaymentConfigurationError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-001",
                callback_url="http://example.com/callback",
                customer={"email": "test@example.com"},
            )

    @override_settings(PAYMENT_PROVIDER="stripe")
    def test_stripe_raises_not_implemented(self):
        """Stripe stub raises NotImplementedError."""
        with self.assertRaises(NotImplementedError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-001",
                callback_url="http://example.com/callback",
                customer={"email": "test@example.com"},
            )

    @override_settings(PAYMENT_PROVIDER="stripe")
    def test_stripe_verify_raises_not_implemented(self):
        """Stripe stub verify raises NotImplementedError."""
        with self.assertRaises(NotImplementedError):
            verify_payment("TX-001")


class PaymentServiceChapaInitializeTests(TestCase):
    """Test Chapa payment initialisation via mocked HTTP calls."""

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_returns_normalized_shape(self, mock_build_session):
        """initialize_payment() normalises the Chapa response."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "data": {
                "checkout_url": "https://checkout.chapa.co/pay/test123",
                "tx_ref": "TX-INIT-001",
            },
        }
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        result = initialize_payment(
            amount=Decimal("500.00"),
            currency="ETB",
            reference="TX-INIT-001",
            callback_url="http://example.com/callback",
            customer={
                "email": "buyer@example.com",
                "first_name": "Test",
                "last_name": "User",
            },
        )

        # Verify normalised shape
        self.assertEqual(result["provider"], "chapa")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["provider_status"], "success")
        self.assertEqual(result["reference"], "TX-INIT-001")
        self.assertEqual(result["amount"], Decimal("500.00"))
        self.assertEqual(result["currency"], "ETB")
        self.assertEqual(
            result["checkout_url"], "https://checkout.chapa.co/pay/test123"
        )
        self.assertIsInstance(result["raw"], dict)

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_raises_on_http_failure(self, mock_build_session):
        """initialize_payment() raises PaymentProviderError on non-200 status."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_response.json.return_value = {"message": "Bad Request"}
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentProviderError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-FAIL-001",
                callback_url="http://example.com/callback",
                customer={"email": "buyer@example.com"},
            )

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_raises_on_network_error(self, mock_build_session):
        """initialize_payment() raises PaymentProviderError on network failure."""
        import requests as requests_lib

        mock_session = MagicMock()
        mock_session.request.side_effect = requests_lib.ConnectionError(
            "Network error"
        )
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentProviderError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-NET-001",
                callback_url="http://example.com/callback",
                customer={"email": "buyer@example.com"},
            )

    @override_settings(PAYMENT_PROVIDER="chapa")
    def test_initialize_raises_without_secret_key(self):
        """initialize_payment() raises when CHAPA_SECRET_KEY is missing."""
        with self.settings(CHAPA_SECRET_KEY=""):
            with self.assertRaises(PaymentConfigurationError):
                initialize_payment(
                    amount=Decimal("100.00"),
                    currency="ETB",
                    reference="TX-NOKEY-001",
                    callback_url="http://example.com/callback",
                    customer={"email": "buyer@example.com"},
                )

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_raises_on_auth_failure(self, mock_build_session):
        """initialize_payment() raises PaymentAuthenticationError on 401."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_response.json.return_value = {"message": "Invalid API key"}
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentAuthenticationError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-AUTH-001",
                callback_url="http://example.com/callback",
                customer={"email": "buyer@example.com"},
            )

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_raises_on_server_error(self, mock_build_session):
        """initialize_payment() raises PaymentServerError on 500."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_response.json.return_value = {"message": "Internal Server Error"}
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentServerError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-500-001",
                callback_url="http://example.com/callback",
                customer={"email": "buyer@example.com"},
            )

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_with_return_url(self, mock_build_session):
        """initialize_payment() includes return_url in payload when provided."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "data": {
                "checkout_url": "https://checkout.chapa.co/pay/test456",
                "tx_ref": "TX-RET-001",
            },
        }
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        result = initialize_payment(
            amount=Decimal("200.00"),
            currency="ETB",
            reference="TX-RET-001",
            callback_url="http://example.com/callback",
            customer={"email": "buyer@example.com"},
            return_url="http://example.com/return",
        )

        # Verify the session was called with return_url in payload
        call_kwargs = mock_session.request.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        self.assertEqual(payload["return_url"], "http://example.com/return")
        self.assertEqual(result["status"], "success")

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_initialize_raises_on_malformed_json(self, mock_build_session):
        """initialize_payment() raises PaymentProviderError on malformed JSON."""
        import requests as requests_lib

        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.side_effect = requests_lib.exceptions.JSONDecodeError(
            "Expecting value", "", 0
        )
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentProviderError):
            initialize_payment(
                amount=Decimal("100.00"),
                currency="ETB",
                reference="TX-JSON-001",
                callback_url="http://example.com/callback",
                customer={"email": "buyer@example.com"},
            )


class PaymentServiceChapaVerifyTests(TestCase):
    """Test Chapa payment verification via mocked HTTP calls."""

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_verify_returns_normalized_shape(self, mock_build_session):
        """verify_payment() normalises the Chapa verification response."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "data": {
                "amount": 500.0,
                "currency": "ETB",
                "reference": "CHAPA-REF-001",
                "tx_ref": "TX-VERIFY-001",
            },
        }
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        result = verify_payment("TX-VERIFY-001")

        # Verify normalised shape
        self.assertEqual(result["provider"], "chapa")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["provider_status"], "success")
        self.assertEqual(result["reference"], "TX-VERIFY-001")
        self.assertEqual(result["amount"], Decimal("500.0"))
        self.assertEqual(result["currency"], "ETB")
        self.assertIsInstance(result["raw"], dict)

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_verify_raises_on_http_failure(self, mock_build_session):
        """verify_payment() raises PaymentProviderError on non-200 status."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_response.json.return_value = {"message": "Not Found"}
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentProviderError):
            verify_payment("TX-NOTFOUND-001")

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_verify_raises_on_network_error(self, mock_build_session):
        """verify_payment() raises PaymentProviderError on network failure."""
        import requests as requests_lib

        mock_session = MagicMock()
        mock_session.request.side_effect = requests_lib.ConnectionError(
            "Network error"
        )
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentProviderError):
            verify_payment("TX-NET-001")

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_verify_handles_null_amount(self, mock_build_session):
        """verify_payment() handles null amount from provider gracefully."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "pending",
            "data": {
                "currency": "ETB",
                "reference": "CHAPA-REF-002",
            },
        }
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        result = verify_payment("TX-PENDING-001")

        self.assertEqual(result["status"], "pending")
        self.assertIsNone(result["amount"])
        self.assertEqual(result["currency"], "ETB")

    @override_settings(
        PAYMENT_PROVIDER="chapa", CHAPA_SECRET_KEY="test-secret-key"
    )
    @patch(
        "apps.shared.payment.providers.chapa.ChapaPaymentProvider._build_session"
    )
    def test_verify_raises_on_auth_failure(self, mock_build_session):
        """verify_payment() raises PaymentAuthenticationError on 403."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"
        mock_response.json.return_value = {"message": "Forbidden"}
        mock_session.request.return_value = mock_response
        mock_build_session.return_value = mock_session

        with self.assertRaises(PaymentAuthenticationError):
            verify_payment("TX-FORBIDDEN-001")
