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
