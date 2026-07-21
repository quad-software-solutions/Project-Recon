import os
import re
import uuid

import magic

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.utils.deconstruct import deconstructible


ALLOWED_FILE_EXTENSIONS = frozenset({
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".pdf", ".doc", ".docx",
})

# Acceptable libmagic MIME types per extension
MAGIC_MIME_MAP = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".gif": {"image/gif"},
    ".webp": {"image/webp"},
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword", "application/x-troff-ms", "application/vnd.ms-word"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
    },
}

MAX_FILE_SIZE_MB = getattr(settings, "SHARED_MAX_FILE_SIZE_MB", 10)
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

UNSAFE_FILENAME_PATTERN = re.compile(r"[^\w\s.-]")


def sanitize_filename(name):
    """Strip directory separators and dangerous characters."""
    name = os.path.basename(name)
    root, ext = os.path.splitext(name)
    root = re.sub(r"[^\w\s-]", "", root).strip()[:100]
    ext = re.sub(r"[^a-zA-Z0-9]", "", ext)
    ext = ("." + ext) if ext and ext != "." else ""
    if not root:
        root = "untitled"
    return f"{root}{ext}"


def generate_uuid_filename(instance, filename):
    """Replace filename with UUID to prevent path traversal and name collisions."""
    ext = os.path.splitext(filename)[1].lower()
    return f"{uuid.uuid4()}{ext}"


def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_FILE_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file extension '{ext}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_FILE_EXTENSIONS))}."
        )


def validate_file_mime_type(value):
    ext = os.path.splitext(value.name)[1].lower()
    expected_mimes = MAGIC_MIME_MAP.get(ext)
    if not expected_mimes:
        return
    value.seek(0)
    chunk = value.read(2048)
    value.seek(0)
    actual_mime = magic.from_buffer(chunk, mime=True)
    if actual_mime not in expected_mimes:
        raise ValidationError(
            f"File content type '{actual_mime}' does not match "
            f"expected type(s) for extension '{ext}'."
        )


def validate_file_size(value):
    if value.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            f"File size exceeds {MAX_FILE_SIZE_MB} MB "
            f"({value.size / 1024 / 1024:.1f} MB)."
        )


def validate_uploaded_file(value):
    validate_file_extension(value)
    validate_file_mime_type(value)
    validate_file_size(value)


@deconstructible
class FileExtensionValidator:
    def __call__(self, value):
        validate_file_extension(value)


@deconstructible
class FileSizeValidator:
    def __call__(self, value):
        validate_file_size(value)


@deconstructible
class UploadedFileValidator:
    def __call__(self, value):
        validate_uploaded_file(value)


@deconstructible
class HttpsUrlValidator:
    """
    Validate a URL uses https and does not point to a private/reserved IP.
    """

    message = "Only HTTPS URLs are allowed."

    def __call__(self, value):
        URLValidator(schemes=["https"])(value)
        self._reject_private_ip(value)

    @staticmethod
    def _reject_private_ip(url):
        from urllib.parse import urlparse
        import ipaddress
        host = urlparse(url).hostname
        if host is None:
            return
        try:
            addr = ipaddress.ip_address(host)
            if addr.is_private or addr.is_loopback or addr.is_link_local:
                raise ValidationError("URL must not point to a private or internal IP.")
        except ValueError:
            pass
