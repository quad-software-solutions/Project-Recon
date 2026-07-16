from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/accounts/", include("apps.accounts.api.urls")),
    path("api/v1/audit/", include("apps.shared.audit.api.urls")),
    path("api/v1/", include("apps.shared.bank.api.urls")),
    path("api/v1/cms/", include("apps.cms.api.urls")),
    path("api/v1/academic/", include("apps.academic.api.urls")),
    path("api/v1/events/", include("apps.events.api.urls")),
    path("api/v1/store/", include("apps.store.api.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
