from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginAnonThrottle(AnonRateThrottle):
    scope = "anon_login"


class ForgotPasswordAnonThrottle(AnonRateThrottle):
    scope = "anon_forgot_password"


class ResetPasswordAnonThrottle(AnonRateThrottle):
    scope = "anon_reset_password"


class OTPRequestUserThrottle(UserRateThrottle):
    scope = "user_otp_request"


class OTPVerifyUserThrottle(UserRateThrottle):
    scope = "user_otp_verify"


class ChangePasswordUserThrottle(UserRateThrottle):
    scope = "user_change_password"


class LogoutUserThrottle(UserRateThrottle):
    scope = "user_logout"


class AdminUserThrottle(UserRateThrottle):
    scope = "admin_user"


class EmailOTPThrottle(AnonRateThrottle):
    """
    Throttle public OTP endpoints by email (not by IP).

    Prevents NAT/CGNAT users from sharing a throttle counter.
    Keys on the ``email`` field from the request body.
    """

    scope = "email_otp"

    def get_cache_key(self, request, view):
        if request.method == "POST" and request.data.get("email"):
            return self.cache_format % {"scope": self.scope, "ident": request.data["email"].lower().strip()}
        return None
