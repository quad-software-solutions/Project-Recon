"""Payment provider configuration.

Reads provider selection and Chapa API credentials from environment
variables via ``django-environ`` and exposes them as Django settings
consumed by ``apps.shared.payment.payment_service``.

Settings defined here:
    PAYMENT_PROVIDER: Active provider key (``chapa`` | ``stripe``).
    CHAPA_SECRET_KEY: Chapa API secret key.
    CHAPA_BASE_URL: Chapa API base URL (defaults to production).
    CHAPA_TIMEOUT_SECONDS: Request timeout in seconds (defaults to 30).
"""

import environ

env = environ.Env()

# ─── Provider selection ───────────────────────────────────────────────
PAYMENT_PROVIDER: str = env("PAYMENT_PROVIDER", default="chapa")

# ─── Chapa configuration (used when PAYMENT_PROVIDER=chapa) ──────────
CHAPA_SECRET_KEY: str = env("CHAPA_SECRET_KEY", default="")
CHAPA_BASE_URL: str = env("CHAPA_BASE_URL", default="https://api.chapa.co/v1")
CHAPA_TIMEOUT_SECONDS: int = env.int("CHAPA_TIMEOUT_SECONDS", default=30)
CHAPA_RETRY_TOTAL: int = env.int("CHAPA_RETRY_TOTAL", default=3)
CHAPA_RETRY_BACKOFF_FACTOR: float = env.float("CHAPA_RETRY_BACKOFF_FACTOR", default=0.5)
