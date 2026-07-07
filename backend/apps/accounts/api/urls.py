"""
Accounts API URL configuration.

Exposes versioned routes under ``/api/v1/accounts/``:

Auth:
  POST login/, logout/, token/refresh/
  POST email-verification/request/, email-verification/verify/
  POST device-verification/request/, device-verification/verify/
  POST password/forgot/, password/reset/, password/change/

Users:
  GET|POST users/, GET|PATCH users/{id}/
  POST users/branch-managers/, users/staff/
  POST users/{id}/activate|deactivate|archive|change-email/

Branches:
  GET|POST branches/, POST branches/with-manager/
  GET|PATCH branches/{id}/
  POST branches/{id}/assign-manager|change-manager|activate|deactivate|archive/

Assignments:
  GET|POST assignments/, PATCH|DELETE assignments/{id}/
  POST assignments/{id}/make-primary/, assignments/transfer/

Devices:
  GET devices/, DELETE devices/{id}/, POST devices/revoke-all/
"""

from django.urls import path

from apps.accounts.views import (
    AssignmentDetailView,
    AssignmentListCreateView,
    AssignmentMakePrimaryView,
    AssignmentTransferView,
    BranchActivateView,
    BranchArchiveView,
    BranchAssignManagerView,
    BranchChangeManagerView,
    BranchDeactivateView,
    BranchDetailView,
    BranchListCreateView,
    BranchWithManagerView,
    ChangePasswordView,
    CreateBranchManagerView,
    CreateStaffUserView,
    DeviceDetailView,
    DeviceListView,
    DeviceRevokeAllView,
    DeviceVerificationRequestView,
    DeviceVerificationVerifyView,
    EmailVerificationRequestView,
    EmailVerificationVerifyView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    PublicEmailVerificationRequestView,
    PublicEmailVerificationVerifyView,
    ResetPasswordView,
    TokenRefreshView,
    UserActivateView,
    UserArchiveView,
    UserDeactivateView,
    UserDetailView,
    UserListView,
)

urlpatterns = [
    # Auth
    path("login/", LoginView.as_view(), name="accounts-login"),
    path("logout/", LogoutView.as_view(), name="accounts-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="accounts-token-refresh"),
    path(
        "email-verification/request/",
        EmailVerificationRequestView.as_view(),
        name="accounts-email-verification-request",
    ),
    path(
        "email-verification/verify/",
        EmailVerificationVerifyView.as_view(),
        name="accounts-email-verification-verify",
    ),
    path(
        "device-verification/request/",
        DeviceVerificationRequestView.as_view(),
        name="accounts-device-verification-request",
    ),
    path(
        "device-verification/verify/",
        DeviceVerificationVerifyView.as_view(),
        name="accounts-device-verification-verify",
    ),
    path("password/forgot/", ForgotPasswordView.as_view(), name="accounts-password-forgot"),
    path("password/reset/", ResetPasswordView.as_view(), name="accounts-password-reset"),
    path("password/change/", ChangePasswordView.as_view(), name="accounts-password-change"),
    # Public email verification (no auth required)
    path(
        "public/email-verification/request/",
        PublicEmailVerificationRequestView.as_view(),
        name="accounts-public-email-verification-request",
    ),
    path(
        "public/email-verification/verify/",
        PublicEmailVerificationVerifyView.as_view(),
        name="accounts-public-email-verification-verify",
    ),
    # Users
    path("users/", UserListView.as_view(), name="accounts-user-list"),
    path("users/staff/", CreateStaffUserView.as_view(), name="accounts-user-create-staff"),
    path(
        "users/branch-managers/",
        CreateBranchManagerView.as_view(),
        name="accounts-user-create-branch-manager",
    ),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="accounts-user-detail"),
    path("users/<uuid:pk>/activate/", UserActivateView.as_view(), name="accounts-user-activate"),
    path(
        "users/<uuid:pk>/deactivate/",
        UserDeactivateView.as_view(),
        name="accounts-user-deactivate",
    ),
    path("users/<uuid:pk>/archive/", UserArchiveView.as_view(), name="accounts-user-archive"),
    # Branches
    path("branches/", BranchListCreateView.as_view(), name="accounts-branch-list"),
    path(
        "branches/with-manager/",
        BranchWithManagerView.as_view(),
        name="accounts-branch-with-manager",
    ),
    path("branches/<uuid:pk>/", BranchDetailView.as_view(), name="accounts-branch-detail"),
    path(
        "branches/<uuid:pk>/assign-manager/",
        BranchAssignManagerView.as_view(),
        name="accounts-branch-assign-manager",
    ),
    path(
        "branches/<uuid:pk>/change-manager/",
        BranchChangeManagerView.as_view(),
        name="accounts-branch-change-manager",
    ),
    path(
        "branches/<uuid:pk>/activate/",
        BranchActivateView.as_view(),
        name="accounts-branch-activate",
    ),
    path(
        "branches/<uuid:pk>/deactivate/",
        BranchDeactivateView.as_view(),
        name="accounts-branch-deactivate",
    ),
    path(
        "branches/<uuid:pk>/archive/",
        BranchArchiveView.as_view(),
        name="accounts-branch-archive",
    ),
    # Assignments
    path("assignments/", AssignmentListCreateView.as_view(), name="accounts-assignment-list"),
    path(
        "assignments/transfer/",
        AssignmentTransferView.as_view(),
        name="accounts-assignment-transfer",
    ),
    path(
        "assignments/<uuid:pk>/",
        AssignmentDetailView.as_view(),
        name="accounts-assignment-detail",
    ),
    path(
        "assignments/<uuid:pk>/make-primary/",
        AssignmentMakePrimaryView.as_view(),
        name="accounts-assignment-make-primary",
    ),
    # Devices
    path("devices/", DeviceListView.as_view(), name="accounts-device-list"),
    path("devices/revoke-all/", DeviceRevokeAllView.as_view(), name="accounts-device-revoke-all"),
    path("devices/<uuid:pk>/", DeviceDetailView.as_view(), name="accounts-device-detail"),
]
