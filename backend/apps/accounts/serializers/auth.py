"""Authentication request and response serializers."""

from django.conf import settings
from rest_framework import serializers

from apps.accounts.serializers.device import DeviceInfoSerializer


class LoginSerializer(serializers.Serializer):
    """Validate login credentials and optional device metadata."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    device_id = serializers.CharField(required=False, allow_blank=True)
    device_name = serializers.CharField(required=False, allow_blank=True)
    device_type = serializers.ChoiceField(
        choices=DeviceInfoSerializer().fields["device_type"].choices,
        required=False,
    )
    fingerprint = serializers.CharField(required=False, allow_blank=True)
    user_agent = serializers.CharField(required=False, allow_blank=True)

    def get_device_info(self) -> dict:
        """Return device_info dict for AuthenticationService.login."""
        return {
            k: self.validated_data[k]
            for k in ("device_id", "device_name", "device_type", "fingerprint", "user_agent")
            if k in self.validated_data and self.validated_data[k]
        }


class TokenPairSerializer(serializers.Serializer):
    """JWT access and refresh token pair (output only)."""

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)


class LogoutSerializer(serializers.Serializer):
    """Validate logout refresh token."""

    refresh = serializers.CharField(write_only=True)


class RefreshTokenSerializer(serializers.Serializer):
    """Validate token refresh request."""

    refresh = serializers.CharField()


class OTPVerifySerializer(serializers.Serializer):
    """Validate OTP code submission (never returned in responses)."""

    otp = serializers.CharField(write_only=True, min_length=4, max_length=12)


class EmailVerificationVerifySerializer(OTPVerifySerializer):
    """Email verification OTP with optional first-device registration."""

    device_id = serializers.CharField(required=False, allow_blank=True)
    device_name = serializers.CharField(required=False, allow_blank=True)
    device_type = serializers.ChoiceField(
        choices=DeviceInfoSerializer().fields["device_type"].choices,
        required=False,
    )
    fingerprint = serializers.CharField(required=False, allow_blank=True)
    user_agent = serializers.CharField(required=False, allow_blank=True)

    def get_device_info(self) -> dict | None:
        """Return device_info when fingerprint is provided."""
        keys = ("device_id", "device_name", "device_type", "fingerprint", "user_agent")
        info = {k: self.validated_data[k] for k in keys if k in self.validated_data and self.validated_data[k]}
        return info or None


class DeviceVerificationRequestSerializer(DeviceInfoSerializer):
    """Device verification OTP request body."""


class DeviceVerificationVerifySerializer(OTPVerifySerializer):
    """Device verification OTP plus device registration metadata."""

    device_id = serializers.CharField()
    device_name = serializers.CharField(required=False, allow_blank=True)
    device_type = serializers.ChoiceField(
        choices=DeviceInfoSerializer().fields["device_type"].choices,
        required=False,
    )
    fingerprint = serializers.CharField()
    user_agent = serializers.CharField(required=False, allow_blank=True)

    def get_device_info(self) -> dict:
        """Return device_info for DeviceService."""
        return {
            k: self.validated_data[k]
            for k in ("device_id", "device_name", "device_type", "fingerprint", "user_agent")
            if k in self.validated_data
        }


class ForgotPasswordSerializer(serializers.Serializer):
    """Initiate password reset."""

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Complete password reset with OTP."""

    email = serializers.EmailField()
    otp = serializers.CharField(write_only=True, min_length=4, max_length=12)
    new_password = serializers.CharField(write_only=True, min_length=settings.PASSWORD_MIN_LENGTH)


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for authenticated user."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=settings.PASSWORD_MIN_LENGTH)
