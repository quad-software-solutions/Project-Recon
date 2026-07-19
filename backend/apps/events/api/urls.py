from django.urls import path

from apps.events.api.views import (
    PublicEventListView,
    PublicEventDetailView,
    LiveEventListView,
    UpcomingEventListView,
    PastEventListView,
    PublicTournamentListView,
    PublicTournamentDetailView,
    PublicTournamentStandingsView,
    PublicTournamentWinnerView,
    PublicTournamentMatchListView,
    PublicWorkshopListView,
    PublicWorkshopDetailView,
    AdminEventListCreateView,
    AdminEventRetrieveUpdateDestroyView,
    AdminEventPublishView,
    AdminEventUnpublishView,
    AdminEventActivateView,
    AdminEventDeactivateView,
    AdminTournamentListCreateView,
    AdminTournamentRetrieveUpdateDestroyView,
    AdminTournamentCloseView,
    AdminTournamentReopenView,
    AdminTournamentCategoryListCreateView,
    AdminTournamentCategoryRetrieveUpdateDestroyView,
    AdminTeamListCreateView,
    AdminTeamRetrieveUpdateDestroyView,
    AdminTournamentTeamListView,
    AdminMatchListCreateView,
    AdminMatchRetrieveUpdateDestroyView,
    AdminMatchAssignTeamView,
    AdminMatchRemoveTeamView,
    AdminMatchRecordScoresView,
    AdminMatchCompleteView,
    AdminTournamentMatchListView,
    AdminTournamentStandingsView,
    AdminTournamentWinnerView,
    AdminWorkshopListCreateView,
    AdminWorkshopRetrieveUpdateDestroyView,
    AdminRegistrationListView,
    AdminRegistrationDetailView,
    AdminRegistrationApproveView,
    AdminRegistrationRejectView,
    AdminRegistrationCancelView,
    AdminRegistrationConvertTeamView,
    AdminCashPaymentView,
    AdminPaymentVerifyView,
    AdminPaymentRejectView,
    AdminPaymentListView,
    EventRegisterView,
    MyRegistrationListView,
    MyRegistrationCancelView,
    RegistrationVerifyEmailView,
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
    # Tournaments
    path("admin/tournaments/", AdminTournamentListCreateView.as_view(), name="events-admin-tournament-list"),
    path(
        "admin/tournaments/<uuid:pk>/",
        AdminTournamentRetrieveUpdateDestroyView.as_view(),
        name="events-admin-tournament-detail",
    ),
    path(
        "admin/tournaments/<uuid:pk>/close/",
        AdminTournamentCloseView.as_view(),
        name="events-admin-tournament-close",
    ),
    path(
        "admin/tournaments/<uuid:pk>/reopen/",
        AdminTournamentReopenView.as_view(),
        name="events-admin-tournament-reopen",
    ),
    # Tournament Categories
    path(
        "admin/tournament-categories/",
        AdminTournamentCategoryListCreateView.as_view(),
        name="events-admin-tournament-category-list",
    ),
    path(
        "admin/tournament-categories/<uuid:pk>/",
        AdminTournamentCategoryRetrieveUpdateDestroyView.as_view(),
        name="events-admin-tournament-category-detail",
    ),
    # Tournament Teams
    path("admin/tournament-teams/", AdminTeamListCreateView.as_view(), name="events-admin-team-list"),
    path(
        "admin/tournament-teams/<uuid:pk>/",
        AdminTeamRetrieveUpdateDestroyView.as_view(),
        name="events-admin-team-detail",
    ),
    path(
        "admin/tournaments/<uuid:pk>/teams/",
        AdminTournamentTeamListView.as_view(),
        name="events-admin-tournament-teams-list",
    ),
    # Matches
    path("admin/matches/", AdminMatchListCreateView.as_view(), name="events-admin-match-list"),
    path(
        "admin/matches/<uuid:pk>/",
        AdminMatchRetrieveUpdateDestroyView.as_view(),
        name="events-admin-match-detail",
    ),
    path(
        "admin/matches/<uuid:pk>/assign-team/",
        AdminMatchAssignTeamView.as_view(),
        name="events-admin-match-assign-team",
    ),
    path(
        "admin/matches/<uuid:pk>/remove-team/",
        AdminMatchRemoveTeamView.as_view(),
        name="events-admin-match-remove-team",
    ),
    path(
        "admin/matches/<uuid:pk>/record-scores/",
        AdminMatchRecordScoresView.as_view(),
        name="events-admin-match-record-scores",
    ),
    path(
        "admin/matches/<uuid:pk>/complete/",
        AdminMatchCompleteView.as_view(),
        name="events-admin-match-complete",
    ),
    path(
        "admin/tournaments/<uuid:pk>/matches/",
        AdminTournamentMatchListView.as_view(),
        name="events-admin-tournament-matches-list",
    ),
    # Workshops
    path("admin/workshops/", AdminWorkshopListCreateView.as_view(), name="events-admin-workshop-list"),
    path(
        "admin/workshops/<uuid:pk>/",
        AdminWorkshopRetrieveUpdateDestroyView.as_view(),
        name="events-admin-workshop-detail",
    ),
    # Rankings
    path(
        "admin/tournaments/<uuid:pk>/standings/",
        AdminTournamentStandingsView.as_view(),
        name="events-admin-tournament-standings",
    ),
    path(
        "admin/tournaments/<uuid:pk>/winner/",
        AdminTournamentWinnerView.as_view(),
        name="events-admin-tournament-winner",
    ),
    # Public Tournaments
    path("events/tournaments/", PublicTournamentListView.as_view(), name="events-public-tournament-list"),
    path(
        "events/tournaments/<uuid:pk>/",
        PublicTournamentDetailView.as_view(),
        name="events-public-tournament-detail",
    ),
    path(
        "events/tournaments/<uuid:pk>/standings/",
        PublicTournamentStandingsView.as_view(),
        name="events-public-tournament-standings",
    ),
    path(
        "events/tournaments/<uuid:pk>/winner/",
        PublicTournamentWinnerView.as_view(),
        name="events-public-tournament-winner",
    ),
    path(
        "events/tournaments/<uuid:pk>/matches/",
        PublicTournamentMatchListView.as_view(),
        name="events-public-tournament-matches",
    ),
    # Public Workshops
    path("events/workshops/", PublicWorkshopListView.as_view(), name="events-public-workshop-list"),
    path(
        "events/workshops/<uuid:pk>/",
        PublicWorkshopDetailView.as_view(),
        name="events-public-workshop-detail",
    ),
    # Registration
    path("events/<uuid:pk>/register/", EventRegisterView.as_view(), name="events-register"),
    path(
        "events/registrations/<uuid:pk>/verify-email/",
        RegistrationVerifyEmailView.as_view(),
        name="events-registration-verify-email",
    ),
    path("my-registrations/", MyRegistrationListView.as_view(), name="events-my-registrations"),
    path(
        "my-registrations/<uuid:pk>/cancel/",
        MyRegistrationCancelView.as_view(),
        name="events-my-registrations-cancel",
    ),
    path(
        "admin/registrations/",
        AdminRegistrationListView.as_view(),
        name="events-admin-registration-list",
    ),
    path(
        "admin/registrations/<uuid:pk>/",
        AdminRegistrationDetailView.as_view(),
        name="events-admin-registration-detail",
    ),
    path(
        "admin/registrations/<uuid:pk>/approve/",
        AdminRegistrationApproveView.as_view(),
        name="events-admin-registration-approve",
    ),
    path(
        "admin/registrations/<uuid:pk>/reject/",
        AdminRegistrationRejectView.as_view(),
        name="events-admin-registration-reject",
    ),
    path(
        "admin/registrations/<uuid:pk>/cancel/",
        AdminRegistrationCancelView.as_view(),
        name="events-admin-registration-cancel",
    ),
    path(
        "admin/registrations/<uuid:pk>/convert-to-team/",
        AdminRegistrationConvertTeamView.as_view(),
        name="events-admin-registration-convert-to-team",
    ),
    # Payments
    path(
        "admin/registrations/<uuid:pk>/pay/cash/",
        AdminCashPaymentView.as_view(),
        name="events-admin-registration-pay-cash",
    ),
    path(
        "admin/registrations/<uuid:pk>/verify-payment/",
        AdminPaymentVerifyView.as_view(),
        name="events-admin-registration-verify-payment",
    ),
    path(
        "admin/registrations/<uuid:pk>/reject-payment/",
        AdminPaymentRejectView.as_view(),
        name="events-admin-registration-reject-payment",
    ),
    path(
        "admin/payments/",
        AdminPaymentListView.as_view(),
        name="events-admin-payment-list",
    ),
]
