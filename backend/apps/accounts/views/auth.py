"""Authentication API views."""

from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.serializers.auth import (
    ChangePasswordSerializer,
    DeviceVerificationRequestSerializer,
    DeviceVerificationVerifySerializer,
    EmailVerificationVerifySerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
    ResetPasswordSerializer,
    TokenPairSerializer,
)
from apps.accounts.api.throttles import (
    ForgotPasswordAnonThrottle,
    LoginAnonThrottle,
    OTPRequestUserThrottle,
    OTPVerifyUserThrottle,
    ResetPasswordAnonThrottle,
)
from apps.accounts.serializers.device import TrustedDeviceSerializer
from apps.accounts.services.device_service import build_device_info
from apps.accounts.services.authentication_service import (
    forgot_password,
    login,
    logout,
    logout_all,
    refresh_token,
    reset_password,
    change_password,
    verify_email_otp,
    verify_device_otp,
    request_email_verification,
    request_device_verification,
    public_request_email_verification,
    public_verify_email_otp,
)


class LoginView(APIView):
    """
    Authenticate with email and password.

    Request: email, password, optional device metadata.
    Response: JWT access and refresh tokens.
    """

    permission_classes = [AllowAny]
    throttle_classes = [LoginAnonThrottle]

    @extend_schema(
        tags=["Auth"],
        request=LoginSerializer,
        responses=TokenPairSerializer,
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device_info = build_device_info(
            serializer.get_device_info(),
            request,
        )

        result = login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            device_info=device_info or None,
        )

        # If login returns a verification requirement instead of tokens
        if result.get("requires_verification"):
            return Response({
                "code": "email_not_verified",
                "detail": "Email verification required. An OTP has been sent to your email.",
                "email": result["email"],
            }, status=403)

        return Response(TokenPairSerializer(result).data)


class LogoutView(APIView):
    """
    Blacklist refresh token and record logout.

    Request body: refresh token.
    Requires authentication.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"], request=LogoutSerializer, responses={204: None})
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logout(request.user, serializer.validated_data["refresh"])
        return Response(status=204)


class LogoutAllView(APIView):
    """
    Blacklist all refresh tokens for the authenticated user.

    Invalidates all sessions, forcing login on all devices.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"], responses={200: None})
    def post(self, request):
        count = logout_all(request.user)
        return Response({"blacklisted": count})


class TokenRefreshView(APIView):
    """
    Rotate refresh token and return a new token pair.

    Request body: refresh token.
    Errors: 401 when token is invalid.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Auth"],
        request=RefreshTokenSerializer,
        responses={200: TokenPairSerializer},
    )
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = refresh_token(serializer.validated_data["refresh"])
        return Response(TokenPairSerializer(tokens).data)


class EmailVerificationRequestView(APIView):
    """Send email verification OTP to the authenticated user."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPRequestUserThrottle]

    @extend_schema(tags=["Auth"], responses={204: None})
    def post(self, request):
        request_email_verification(request.user)
        return Response(status=204)


class EmailVerificationVerifyView(APIView):
    """
    Verify email OTP and optionally register the first trusted device.

    Request body: otp, optional device metadata.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPVerifyUserThrottle]

    @extend_schema(tags=["Auth"], request=EmailVerificationVerifySerializer, responses={204: None})
    def post(self, request):
        serializer = EmailVerificationVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device_info = serializer.get_device_info()

        if device_info:
            device_info = build_device_info(device_info, request)

        verify_email_otp(
            request.user,
            serializer.validated_data["otp"],
            device_info=device_info,
        )
        return Response(status=204)


class PublicEmailVerificationRequestView(APIView):
    """Send email verification OTP to a user identified by email (public)."""

    permission_classes = [AllowAny]
    throttle_classes = [OTPRequestUserThrottle]

    @extend_schema(tags=["Auth"], responses={204: None})
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"email": ["This field is required."]}, status=400)
        public_request_email_verification(email)
        return Response(status=204)


class PublicEmailVerificationVerifyView(APIView):
    """
    Verify email OTP for a user identified by email (public).

    On success, returns JWT tokens so the user is logged in immediately.
    """

    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyUserThrottle]

    @extend_schema(tags=["Auth"], responses={200: TokenPairSerializer})
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        if not email or not otp:
            errors = {}
            if not email:
                errors["email"] = ["This field is required."]
            if not otp:
                errors["otp"] = ["This field is required."]
            return Response(errors, status=400)

        device_info = None
        fingerprint = request.data.get("fingerprint")
        if fingerprint:
            device_info = build_device_info({
                "device_id": request.data.get("device_id", ""),
                "fingerprint": fingerprint,
                "user_agent": request.data.get("user_agent", ""),
            }, request)

        tokens = public_verify_email_otp(email, otp, device_info=device_info)
        return Response(TokenPairSerializer(tokens).data)


class DeviceVerificationRequestView(APIView):
    """Send device verification OTP for a new device."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPRequestUserThrottle]

    @extend_schema(tags=["Auth"], request=DeviceVerificationRequestSerializer, responses={204: None})
    def post(self, request):
        serializer = DeviceVerificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device_info = build_device_info(serializer.validated_data, request)

        request_device_verification(request.user, device_info)

        return Response(status=204)


class DeviceVerificationVerifyView(APIView):
    """
    Verify device OTP and register the device as trusted.

    Response: trusted device record (no OTP echoed).
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPVerifyUserThrottle]

    @extend_schema(
        tags=["Auth"],
        request=DeviceVerificationVerifySerializer,
        responses={200: TrustedDeviceSerializer},
    )
    def post(self, request):
        serializer = DeviceVerificationVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device_info = build_device_info(serializer.get_device_info(), request)

        device = verify_device_otp(
            request.user,
            serializer.validated_data["otp"],
            device_info,
        )

        return Response(TrustedDeviceSerializer(device).data)


class ForgotPasswordView(APIView):
    """Request password reset OTP (does not reveal whether email exists)."""

    permission_classes = [AllowAny]
    throttle_classes = [ForgotPasswordAnonThrottle]

    @extend_schema(tags=["Auth"], request=ForgotPasswordSerializer, responses={200: None})
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        forgot_password(serializer.validated_data["email"])
        
        return Response(status=200)


class ResetPasswordView(APIView):
    """Reset password using OTP."""

    permission_classes = [AllowAny]
    throttle_classes = [ResetPasswordAnonThrottle]

    @extend_schema(tags=["Auth"], request=ResetPasswordSerializer, responses={204: None})
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reset_password(
            email=serializer.validated_data["email"],
            otp=serializer.validated_data["otp"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response(status=204)



class ChangePasswordView(generics.UpdateAPIView):
    """Change the password of the authenticated user."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        change_password(
            self.request.user,
            serializer.validated_data["old_password"],
            serializer.validated_data["new_password"],
            actor=self.request.user,
        )

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)

        return Response({"detail": "Password changed successfully."})
