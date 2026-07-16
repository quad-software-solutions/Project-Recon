"""
Centralized email configuration for Project Recon.
Supports console, SMTP, and AnyMail providers.

EMAIL_PROVIDER options:
  console     — prints to terminal (development only)
  smtp        — any SMTP server (MailerSend SMTP, Gmail, SES SMTP, etc.)
  mailersend  — MailerSend API via anymail
  sendgrid    — SendGrid API via anymail
  postmark    — Postmark API via anymail
  brevo       — Brevo API via anymail
  mailgun     — Mailgun API via anymail
  ses         — AWS SES API via anymail (uses IAM / boto3, no API key needed)
"""

import os
from django.core.exceptions import ImproperlyConfigured


try:
    import anymail  # noqa: F401
    HAS_ANYMAIL = True
except ImportError:
    HAS_ANYMAIL = False


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_int(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# PROVIDER SELECTION
# ---------------------------------------------------------------------------

EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console").lower()

# ---------------------------------------------------------------------------
# CONSOLE
# ---------------------------------------------------------------------------

if EMAIL_PROVIDER == "console":
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# SMTP
# ---------------------------------------------------------------------------

elif EMAIL_PROVIDER == "smtp":
    _smtp_host = os.getenv("SMTP_HOST")
    _smtp_user = os.getenv("SMTP_USER")
    _smtp_password = os.getenv("SMTP_PASSWORD")

    if not all([_smtp_host, _smtp_user, _smtp_password]):
        raise ImproperlyConfigured(
            "EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env"
        )

    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = _smtp_host
    EMAIL_PORT = env_int("SMTP_PORT", 587)
    EMAIL_HOST_USER = _smtp_user
    EMAIL_HOST_PASSWORD = _smtp_password
    EMAIL_USE_TLS = env_bool("SMTP_USE_TLS", True)
    EMAIL_USE_SSL = env_bool("SMTP_USE_SSL", False)

# ---------------------------------------------------------------------------
# ANYMAIL PROVIDERS
# ---------------------------------------------------------------------------

else:
    if not HAS_ANYMAIL:
        raise ImproperlyConfigured(
            f"EMAIL_PROVIDER={EMAIL_PROVIDER} requires django-anymail. "
            "Run: pip install django-anymail"
        )

    _anymail_backend_map = {
        "mailersend": "anymail.backends.mailersend.EmailBackend",
        "sendgrid":   "anymail.backends.sendgrid.EmailBackend",
        "postmark":   "anymail.backends.postmark.EmailBackend",
        "brevo":      "anymail.backends.brevo.EmailBackend",
        "mailgun":    "anymail.backends.mailgun.EmailBackend",
        "ses":        "anymail.backends.amazon_ses.EmailBackend",
    }

    if EMAIL_PROVIDER not in _anymail_backend_map:
        raise ImproperlyConfigured(
            f"Unsupported EMAIL_PROVIDER: '{EMAIL_PROVIDER}'. "
            f"Choose from: {', '.join(_anymail_backend_map)}, smtp, console"
        )

    EMAIL_BACKEND = _anymail_backend_map[EMAIL_PROVIDER]

    _anymail_key_map = {
        "mailersend": "MAILERSEND_API_TOKEN",
        "sendgrid":   "SENDGRID_API_KEY",
        "postmark":   "POSTMARK_SERVER_TOKEN",
        "brevo":      "BREVO_API_KEY",
        "mailgun":    "MAILGUN_API_KEY",
        "ses":        None,
    }

    _anymail_key = _anymail_key_map[EMAIL_PROVIDER]
    if _anymail_key:
        _api_key = os.getenv("EMAIL_API_KEY")
        if not _api_key:
            raise ImproperlyConfigured(
                f"EMAIL_PROVIDER={EMAIL_PROVIDER} requires EMAIL_API_KEY in .env"
            )
        ANYMAIL = {_anymail_key: _api_key}
    else:
        ANYMAIL = {}

# ---------------------------------------------------------------------------
# SHARED SETTINGS
# ---------------------------------------------------------------------------

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")
if not DEFAULT_FROM_EMAIL and EMAIL_PROVIDER != "console":
    raise ImproperlyConfigured(
        "DEFAULT_FROM_EMAIL must be set in .env for non-console email providers"
    )
elif not DEFAULT_FROM_EMAIL:
    DEFAULT_FROM_EMAIL = "noreply@localhost"

EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = env_int(
    "EMAIL_VERIFICATION_TOKEN_TTL_MINUTES", 30
)

LOGIN_OTP_TTL_MINUTES = env_int("LOGIN_OTP_TTL_MINUTES", 10)

_DEBUG = os.getenv("DEBUG", "").lower() in ("true", "1", "yes")
FRONTEND_VERIFY_EMAIL_URL = os.getenv("FRONTEND_VERIFY_EMAIL_URL")
if not FRONTEND_VERIFY_EMAIL_URL and not _DEBUG:
    raise ImproperlyConfigured(
        "FRONTEND_VERIFY_EMAIL_URL must be set in .env for production"
    )
