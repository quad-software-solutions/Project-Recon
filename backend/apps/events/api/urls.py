from django.urls import path

from apps.events.api.views import (
    PublicEventListView,
    PublicEventDetailView,
    LiveEventListView,
    UpcomingEventListView,
    PastEventListView,
    AdminEventListCreateView,
    AdminEventRetrieveUpdateDestroyView,
    AdminEventPublishView,
    AdminEventUnpublishView,
    AdminEventActivateView,
    AdminEventDeactivateView,
)

urlpatterns = [
    # Public
    path("events/", PublicEventListView.as_view(), name="events-list"),
    path("events/<uuid:pk>/", PublicEventDetailView.as_view(), name="events-detail"),
    path("events/live/", LiveEventListView.as_view(), name="events-live"),
    path("events/upcoming/", UpcomingEventListView.as_view(), name="events-upcoming"),
    path("events/past/", PastEventListView.as_view(), name="events-past"),
    # Staff
    path("admin/events/", AdminEventListCreateView.as_view(), name="events-admin-list"),
    path(
        "admin/events/<uuid:pk>/",
        AdminEventRetrieveUpdateDestroyView.as_view(),
        name="events-admin-detail",
    ),
    path(
        "admin/events/<uuid:pk>/publish/",
        AdminEventPublishView.as_view(),
        name="events-admin-publish",
    ),
    path(
        "admin/events/<uuid:pk>/unpublish/",
        AdminEventUnpublishView.as_view(),
        name="events-admin-unpublish",
    ),
    path(
        "admin/events/<uuid:pk>/activate/",
        AdminEventActivateView.as_view(),
        name="events-admin-activate",
    ),
    path(
        "admin/events/<uuid:pk>/deactivate/",
        AdminEventDeactivateView.as_view(),
        name="events-admin-deactivate",
    ),
]
