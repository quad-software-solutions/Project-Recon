from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.shared.bank.api.views import BankAccountViewSet

router = DefaultRouter()
router.register(r"bank-accounts", BankAccountViewSet, basename="bank-account")

urlpatterns = [
    path("", include(router.urls)),
]
