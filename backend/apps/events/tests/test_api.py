import uuid

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.constants import AccountStatus
from apps.accounts.models import Branch
from apps.accounts.permissions.roles import Roles
from apps.accounts.services import user_service
from apps.accounts.services.user_service import _create_user_with_role
from apps.academic.models import Student
from apps.events.constants import (
    EventStatus,
    MatchSideType,
    MatchStatus,
    RegistrationMode,
    RegistrationStatus,
    Visibility,
    EventType,
)
from apps.events.models import Event, EventRegistration, Match, Tournament, TournamentCategory, TournamentTeam, Workshop
from apps.events.services.match_service import (
    assign_team_to_side,
    complete_match,
    create_match,
    record_scores,
)


@override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=False)
class EventApiTestCase(APITestCase):
    base_url = "/api/v1/events"

    def setUp(self):
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        user_service.activate_user(self.super_admin)

        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)

        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.valid_event_data = {
            "title": "Test Event",
            "description": "A test event",
            "location": "Test Location",
            "event_type": EventType.GENERAL,
            "start_datetime": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            "end_datetime": (timezone.now() + timezone.timedelta(days=2)).isoformat(),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }

    def _auth(self, user):
        self.client.force_authenticate(user)

    def _create_event(self, **overrides):
        data = {**self.valid_event_data, **overrides}
        return Event.objects.create(**data)

    def _create_tournament_event(self, **overrides):
        data = {**self.valid_event_data, "event_type": EventType.TOURNAMENT, **overrides}
        return Event.objects.create(**data)

    def _create_workshop_event(self, **overrides):
        data = {**self.valid_event_data, "event_type": EventType.WORKSHOP, **overrides}
        return Event.objects.create(**data)


class PublicEventApiTest(EventApiTestCase):
    def test_list_public_events(self):
        self._create_event(status=EventStatus.PUBLISHED, visibility=Visibility.PUBLIC)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_public_events_excludes_draft(self):
        self._create_event(status=EventStatus.DRAFT)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_event_detail(self):
        event = self._create_event()
        response = self.client.get(f"{self.base_url}/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], event.title)

    def test_event_detail_not_found(self):
        response = self.client.get(
            f"{self.base_url}/events/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_live_events(self):
        now = timezone.now()
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now - timezone.timedelta(hours=1),
            end_datetime=now + timezone.timedelta(hours=1),
        )
        response = self.client.get(f"{self.base_url}/events/live/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_upcoming_events(self):
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        response = self.client.get(f"{self.base_url}/events/upcoming/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_past_events(self):
        now = timezone.now()
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now - timezone.timedelta(days=2),
            end_datetime=now - timezone.timedelta(days=1),
        )
        response = self.client.get(f"{self.base_url}/events/past/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)


class AdminEventApiTest(EventApiTestCase):
    def test_create_event_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Event")

    def test_create_event_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_event_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_events_as_admin(self):
        self._auth(self.super_admin)
        self._create_event()
        response = self.client.get(f"{self.base_url}/admin/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.patch(
            f"{self.base_url}/admin/events/{event.id}/",
            {"title": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated")

    def test_delete_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.delete(
            f"{self.base_url}/admin/events/{event.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_publish_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/publish/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], EventStatus.PUBLISHED)

    def test_unpublish_event(self):
        self._auth(self.super_admin)
        event = self._create_event(status=EventStatus.PUBLISHED)
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/unpublish/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], EventStatus.DRAFT)

    def test_activate_event(self):
        self._auth(self.super_admin)
        event = self._create_event(is_active=False)
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/activate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_active"])

    def test_deactivate_event(self):
        self._auth(self.super_admin)
        event = self._create_event()
        response = self.client.post(
            f"{self.base_url}/admin/events/{event.id}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_active"])


class AdminTournamentApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.tournament_event = self._create_tournament_event(
            title="Tournament Event",
        )
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.valid_tournament_data = {
            "event": str(self.tournament_event.id),
            "category": str(self.category.id),
            "max_teams": 16,
        }

    def test_create_tournament_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/",
            self.valid_tournament_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category_name"], "VEX IQ")

    def test_create_tournament_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/",
            self.valid_tournament_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_tournament_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/",
            self.valid_tournament_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tournaments(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        response = self.client.get(f"{self.base_url}/admin/tournaments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_tournament_detail(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{tournament.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(tournament.id))

    def test_update_tournament(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        new_category = TournamentCategory.objects.create(name="VEX V5", code="VEX_V5")
        response = self.client.patch(
            f"{self.base_url}/admin/tournaments/{tournament.id}/",
            {"category": str(new_category.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["category_name"], "VEX V5")

    def test_delete_tournament(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        response = self.client.delete(
            f"{self.base_url}/admin/tournaments/{tournament.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_close_tournament(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/{tournament.id}/close/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_closed"])

    def test_reopen_tournament(self):
        self._auth(self.super_admin)
        tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
            is_closed=True,
        )
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/{tournament.id}/reopen/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_closed"])


class AdminTournamentTeamApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.tournament_event = self._create_tournament_event(
            title="Team Tournament",
        )
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        self.valid_team_data = {
            "tournament": str(self.tournament.id),
            "team_name": "Robo Warriors",
            "organization": "School A",
        }

    def test_create_team_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            self.valid_team_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["team_name"], "Robo Warriors")

    def test_create_team_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            self.valid_team_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_team_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            self.valid_team_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_teams(self):
        self._auth(self.super_admin)
        TournamentTeam.objects.create(tournament=self.tournament, team_name="Team A")
        response = self.client.get(f"{self.base_url}/admin/tournament-teams/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_teams_filtered_by_tournament(self):
        self._auth(self.super_admin)
        TournamentTeam.objects.create(tournament=self.tournament, team_name="Team A")
        response = self.client.get(
            f"{self.base_url}/admin/tournament-teams/?tournament={self.tournament.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_team_detail(self):
        self._auth(self.super_admin)
        team = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Detail Team"
        )
        response = self.client.get(
            f"{self.base_url}/admin/tournament-teams/{team.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["team_name"], "Detail Team")

    def test_update_team(self):
        self._auth(self.super_admin)
        team = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Old Name"
        )
        response = self.client.patch(
            f"{self.base_url}/admin/tournament-teams/{team.id}/",
            {"team_name": "New Name"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["team_name"], "New Name")

    def test_delete_team(self):
        self._auth(self.super_admin)
        team = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Delete Me"
        )
        response = self.client.delete(
            f"{self.base_url}/admin/tournament-teams/{team.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_tournament_teams_list_endpoint(self):
        self._auth(self.super_admin)
        TournamentTeam.objects.create(tournament=self.tournament, team_name="Team A")
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/teams/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_team_duplicate_name_returns_400(self):
        self._auth(self.super_admin)
        self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            self.valid_team_data,
            format="json",
        )
        response = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            self.valid_team_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminMatchApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.tournament_event = self._create_tournament_event(
            title="Match Tournament",
        )
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        self.team_a = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Team Alpha"
        )
        self.team_b = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Team Beta"
        )
        self.valid_match_data = {
            "tournament": str(self.tournament.id),
            "round": "Qualification",
            "scheduled_at": (timezone.now() + timezone.timedelta(hours=1)).isoformat(),
        }

    def test_create_match_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/matches/",
            self.valid_match_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["round"], "Qualification")
        self.assertEqual(response.data["status"], MatchStatus.SCHEDULED)

    def test_create_match_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/matches/",
            self.valid_match_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_match_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/matches/",
            self.valid_match_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_matches(self):
        self._auth(self.super_admin)
        create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.get(f"{self.base_url}/admin/matches/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_matches_filtered_by_tournament(self):
        self._auth(self.super_admin)
        create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.get(
            f"{self.base_url}/admin/matches/?tournament={self.tournament.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_match_detail(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.get(
            f"{self.base_url}/admin/matches/{match.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(match.id))

    def test_update_match(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.patch(
            f"{self.base_url}/admin/matches/{match.id}/",
            {"round": "Final"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["round"], "Final")

    def test_delete_match(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.delete(
            f"{self.base_url}/admin/matches/{match.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_assign_team_to_side(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/assign-team/",
            {"side": MatchSideType.SIDE_A, "tournament_team": str(self.team_a.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["side"], MatchSideType.SIDE_A)

    def test_assign_team_missing_fields(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/assign-team/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_team_from_side(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/remove-team/",
            {"side": MatchSideType.SIDE_A, "tournament_team": str(self.team_a.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_record_scores(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/record-scores/",
            {"side_a_score": 10, "side_b_score": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], MatchStatus.SCHEDULED)

    def test_record_scores_missing_fields(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/record-scores/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_complete_match(self):
        self._auth(self.super_admin)
        match = create_match({**self.valid_match_data, "tournament": self.tournament})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        response = self.client.post(
            f"{self.base_url}/admin/matches/{match.id}/complete/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], MatchStatus.COMPLETED)

    def test_tournament_matches_list_endpoint(self):
        self._auth(self.super_admin)
        create_match({**self.valid_match_data, "tournament": self.tournament})
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/matches/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class AdminRankingApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.tournament_event = self._create_tournament_event(
            title="Ranking Tournament",
        )
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        self.team_a = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Alpha"
        )
        self.team_b = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Beta"
        )
        self.team_c = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Gamma"
        )

    def _complete_match(self, score_a, score_b):
        match = create_match({
            "tournament": self.tournament,
            "round": "Qualification",
            "scheduled_at": timezone.now(),
        })
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, score_a, score_b)
        return complete_match(match)

    def test_standings_as_super_admin(self):
        self._auth(self.super_admin)
        self._complete_match(10, 5)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/standings/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        # Alpha won: 10 pts, Beta lost: 5 pts
        self.assertEqual(response.data[0]["team_name"], "Alpha")
        self.assertEqual(response.data[0]["points"], 10)
        self.assertEqual(response.data[0]["rank"], 1)

    def test_standings_as_branch_manager(self):
        self._auth(self.branch_manager)
        self._complete_match(10, 5)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/standings/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_standings_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/standings/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_standings_top_n(self):
        self._auth(self.super_admin)
        self._complete_match(10, 5)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/standings/?top=2"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_winner_as_super_admin(self):
        self._auth(self.super_admin)
        self._complete_match(10, 5)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/winner/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["team_name"], "Alpha")

    def test_winner_no_matches_returns_null(self):
        self._auth(self.super_admin)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/winner/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_winner_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.get(
            f"{self.base_url}/admin/tournaments/{self.tournament.id}/winner/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminWorkshopApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.workshop_event = self._create_workshop_event(
            title="Test Workshop",
        )
        self.instructor = _create_user_with_role(
            "instructor@test.com", "Jane", "Doe", "StrongP@ssw0rd!2026",
            status="ACTIVE", is_email_verified=True, role=Roles.INSTRUCTOR, branch=self.branch,
        )
        self.valid_workshop_data = {
            "event": str(self.workshop_event.id),
            "instructor": str(self.instructor.id),
            "duration_minutes": 120,
            "level": "BEGINNER",
            "price": 50.00,
        }

    def test_create_workshop_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/workshops/",
            self.valid_workshop_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["duration_minutes"], 120)
        self.assertEqual(response.data["level"], "BEGINNER")

    def test_create_workshop_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/workshops/",
            self.valid_workshop_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_workshop_as_instructor_forbidden(self):
        self._auth(self.instructor)
        response = self.client.post(
            f"{self.base_url}/admin/workshops/",
            self.valid_workshop_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_workshop_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/workshops/",
            self.valid_workshop_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_workshops_as_super_admin(self):
        self._auth(self.super_admin)
        Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.get(f"{self.base_url}/admin/workshops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_workshops_as_instructor(self):
        self._auth(self.instructor)
        Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.get(f"{self.base_url}/admin/workshops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_workshops_instructor_only_sees_own(self):
        other_instructor = _create_user_with_role(
            "other@test.com", "Other", "Inst", "StrongP@ssw0rd!2026",
            status="ACTIVE", is_email_verified=True, role=Roles.INSTRUCTOR, branch=self.branch,
        )
        other_event = self._create_workshop_event(title="Other Workshop")
        Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        Workshop.objects.create(
            event=other_event,
            instructor=other_instructor,
            duration_minutes=60,
            level="ADVANCED",
        )
        self._auth(self.instructor)
        response = self.client.get(f"{self.base_url}/admin/workshops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_workshop_detail_as_super_admin(self):
        self._auth(self.super_admin)
        workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.get(
            f"{self.base_url}/admin/workshops/{workshop.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["duration_minutes"], 120)

    def test_update_workshop_as_super_admin(self):
        self._auth(self.super_admin)
        workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.patch(
            f"{self.base_url}/admin/workshops/{workshop.id}/",
            {"duration_minutes": 180},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["duration_minutes"], 180)

    def test_delete_workshop_as_super_admin(self):
        self._auth(self.super_admin)
        workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.delete(
            f"{self.base_url}/admin/workshops/{workshop.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_instructor_can_view_own_workshop(self):
        self._auth(self.instructor)
        workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.get(
            f"{self.base_url}/admin/workshops/{workshop.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_instructor_cannot_view_other_workshop(self):
        other_instructor = _create_user_with_role(
            "other2@test.com", "Other2", "Inst", "StrongP@ssw0rd!2026",
            status="ACTIVE", is_email_verified=True, role=Roles.INSTRUCTOR, branch=self.branch,
        )
        self._auth(self.instructor)
        workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=other_instructor,
            duration_minutes=120,
            level="BEGINNER",
        )
        response = self.client.get(
            f"{self.base_url}/admin/workshops/{workshop.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RegistrationApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.student_obj = Student.objects.create(
            user=self.student, branch=self.branch,
            date_joined=timezone.now().date(),
        )

    def _make_registerable_event(self, **overrides):
        data = {
            "registration_enabled": True,
            "registration_mode": RegistrationMode.STUDENT,
            "status": EventStatus.PUBLISHED,
            "is_active": True,
        }
        data.update(overrides)
        return self._create_event(**data)

    def _make_public_event(self, **overrides):
        data = {
            "registration_enabled": True,
            "registration_mode": RegistrationMode.PUBLIC,
            "status": EventStatus.PUBLISHED,
            "is_active": True,
        }
        data.update(overrides)
        return self._create_event(**data)

    def _make_tournament_event_with_registration(self, **overrides):
        data = {
            "event_type": EventType.TOURNAMENT,
            "registration_enabled": True,
            "registration_mode": RegistrationMode.STUDENT,
            "status": EventStatus.PUBLISHED,
            "is_active": True,
        }
        data.update(overrides)
        return self._create_event(**data)

    def test_public_register_success(self):
        event = self._make_public_event()
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            {
                "public_full_name": "John Public",
                "public_email": "john@example.com",
                "public_phone": "+1234567890",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["registration_status"], "PENDING")

    def test_public_register_missing_fields(self):
        event = self._make_public_event()
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            {"public_full_name": "John"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_register_success(self):
        self._auth(self.student)
        event = self._make_registerable_event()
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["registration_status"], "PENDING")
        self.assertEqual(str(response.data["student"]), str(self.student_obj.id))

    def test_student_register_unauthenticated_fails_for_student_mode(self):
        event = self._make_registerable_event()
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_registration_disabled(self):
        event = self._create_event()
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            {"public_full_name": "John", "public_email": "john@test.com", "public_phone": "+123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_registrations_list(self):
        self._auth(self.student)
        event = self._make_registerable_event()
        self.client.post(f"{self.base_url}/events/{event.id}/register/", format="json")
        response = self.client.get(f"{self.base_url}/my-registrations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_my_registrations_cancel(self):
        self._auth(self.student)
        event = self._make_registerable_event()
        reg_response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/", format="json"
        )
        reg_id = reg_response.data["id"]
        response = self.client.post(
            f"{self.base_url}/my-registrations/{reg_id}/cancel/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["registration_status"], "CANCELLED")

    def test_my_registrations_cancel_other_student(self):
        self._auth(self.student)
        event = self._make_registerable_event()
        reg_response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/", format="json"
        )
        reg_id = reg_response.data["id"]
        other_student_user = user_service.create_student_user(
            "other@test.com", "Other", "Student", "StrongP@ssw0rd!2026", self.branch
        )
        user_service.activate_user(other_student_user)
        Student.objects.create(
            user=other_student_user, branch=self.branch,
            date_joined=timezone.now().date(),
        )
        self._auth(other_student_user)
        response = self.client.post(
            f"{self.base_url}/my-registrations/{reg_id}/cancel/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def _create_registration_for_admin(self, event):
        reg = EventRegistration.objects.create(
            event=event,
            public_full_name="John Public",
            public_email="john@example.com",
            public_phone="+1234567890",
            registration_status=RegistrationStatus.PENDING,
        )
        return str(reg.id)

    def test_admin_list_registrations(self):
        self._auth(self.super_admin)
        event = self._make_registerable_event()
        self._create_registration_for_admin(event)
        response = self.client.get(f"{self.base_url}/admin/registrations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_admin_list_registrations_filter_by_event(self):
        self._auth(self.super_admin)
        event1 = self._make_registerable_event(title="Event 1")
        event2 = self._make_registerable_event(title="Event 2")
        self._create_registration_for_admin(event1)
        response = self.client.get(
            f"{self.base_url}/admin/registrations/?event={event1.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_admin_get_registration_detail(self):
        self._auth(self.super_admin)
        event = self._make_registerable_event()
        reg_id = self._create_registration_for_admin(event)
        response = self.client.get(
            f"{self.base_url}/admin/registrations/{reg_id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["id"]), reg_id)

    def test_admin_approve_registration(self):
        self._auth(self.super_admin)
        event = self._make_registerable_event()
        reg_id = self._create_registration_for_admin(event)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg_id}/approve/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["registration_status"], "APPROVED")

    def test_admin_reject_registration(self):
        self._auth(self.super_admin)
        event = self._make_registerable_event()
        reg_id = self._create_registration_for_admin(event)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg_id}/reject/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["registration_status"], "REJECTED")

    def test_admin_cancel_registration(self):
        self._auth(self.super_admin)
        event = self._make_registerable_event()
        reg_id = self._create_registration_for_admin(event)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg_id}/cancel/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["registration_status"], "CANCELLED")

    def test_admin_convert_to_team(self):
        self._auth(self.super_admin)
        event = self._make_tournament_event_with_registration()
        category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        Tournament.objects.create(event=event, category=category)
        reg_id = self._create_registration_for_admin(event)
        reg = EventRegistration.objects.get(id=reg_id)
        reg.registration_status = RegistrationStatus.APPROVED
        reg.save(update_fields=["registration_status"])
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg_id}/convert-to-team/",
            {"team_name": "Robo Warriors"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["team_name"], "Robo Warriors")

    def test_admin_convert_to_team_missing_name(self):
        self._auth(self.super_admin)
        event = self._make_tournament_event_with_registration()
        category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        Tournament.objects.create(event=event, category=category)
        reg_id = self._create_registration_for_admin(event)
        reg = EventRegistration.objects.get(id=reg_id)
        reg.registration_status = RegistrationStatus.APPROVED
        reg.save(update_fields=["registration_status"])
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg_id}/convert-to-team/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_registrations_permission_denied_for_regular_user(self):
        self._auth(self.student)
        response = self.client.get(f"{self.base_url}/admin/registrations/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class EventPaymentApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.student_obj = Student.objects.create(
            user=self.student, branch=self.branch,
            date_joined=timezone.now().date(),
        )

    def _make_registerable_event(self, **overrides):
        data = {
            "title": "Test Payment Event",
            "description": "Event for testing payments",
            "location": "Test Location",
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "registration_enabled": True,
            "registration_mode": RegistrationMode.STUDENT,
            "status": EventStatus.PUBLISHED,
        }
        data.update(overrides)
        event = Event.objects.create(**data)
        return event

    def _create_registration_for_admin(self, event):
        reg = EventRegistration.objects.create(
            event=event,
            public_full_name="John Public",
            public_email="john@example.com",
            public_phone="+1234567890",
            registration_status=RegistrationStatus.PENDING,
        )
        return str(reg.id)

    def _create_approved_registration(self):
        event = self._make_registerable_event()
        reg_id = self._create_registration_for_admin(event)
        reg = EventRegistration.objects.get(id=reg_id)
        reg.registration_status = RegistrationStatus.PENDING
        reg.save(update_fields=["registration_status"])
        return reg

    # --- Cash Payment ---

    def test_cash_payment_super_admin(self):
        self._auth(self.super_admin)
        reg = self._create_approved_registration()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg.id}/pay/cash/",
            {"amount": 100.00},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "100.00")
        self.assertEqual(response.data["payment_method"], "CASH")
        self.assertEqual(response.data["status"], "VERIFIED")
        reg.refresh_from_db()
        self.assertEqual(reg.payment_status, "VERIFIED")

    def test_cash_payment_branch_manager(self):
        self._auth(self.branch_manager)
        reg = self._create_approved_registration()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg.id}/pay/cash/",
            {"amount": 50.00},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "50.00")

    def test_cash_payment_student_forbidden(self):
        self._auth(self.student)
        reg = self._create_approved_registration()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg.id}/pay/cash/",
            {"amount": 50.00},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cash_payment_negative_amount(self):
        self._auth(self.super_admin)
        reg = self._create_approved_registration()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg.id}/pay/cash/",
            {"amount": -10},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cash_payment_zero_amount(self):
        self._auth(self.super_admin)
        reg = self._create_approved_registration()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{reg.id}/pay/cash/",
            {"amount": 0},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cash_payment_registration_not_found(self):
        self._auth(self.super_admin)
        fake_id = uuid.uuid4()
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{fake_id}/pay/cash/",
            {"amount": 50.00},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)




class PublicTournamentApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.tournament_event = self._create_tournament_event(
            title="Public Tournament",
            status=EventStatus.PUBLISHED,
            is_active=True,
        )
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.tournament_event,
            category=self.category,
        )
        self.team_a = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Team Alpha", points=10, wins=2
        )
        self.team_b = TournamentTeam.objects.create(
            tournament=self.tournament, team_name="Team Beta", points=5, wins=1
        )

    def test_list_public_tournaments(self):
        response = self.client.get(f"{self.base_url}/events/tournaments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_tournament_list_excludes_draft(self):
        Tournament.objects.create(
            event=self._create_tournament_event(
                title="Draft Tournament", status=EventStatus.DRAFT
            ),
            category=self.category,
        )
        response = self.client.get(f"{self.base_url}/events/tournaments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_tournament_detail(self):
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{self.tournament.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["event_title"], "Public Tournament")

    def test_public_tournament_standings(self):
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{self.tournament.id}/standings/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["team_name"], "Team Alpha")
        self.assertEqual(response.data[1]["team_name"], "Team Beta")

    def test_public_tournament_standings_top_n(self):
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{self.tournament.id}/standings/?top=1"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["team_name"], "Team Alpha")

    def test_public_tournament_winner(self):
        from apps.events.services.match_service import (
            assign_team_to_side, complete_match, create_match, record_scores,
        )
        from apps.events.services.ranking_service import update_tournament_statistics

        match = create_match({"tournament": self.tournament, "round": "Final", "scheduled_at": timezone.now()})
        assign_team_to_side(match, "SIDE_A", str(self.team_a.id))
        assign_team_to_side(match, "SIDE_B", str(self.team_b.id))
        record_scores(match, 10, 5)
        complete_match(match)
        update_tournament_statistics(self.tournament)

        response = self.client.get(
            f"{self.base_url}/events/tournaments/{self.tournament.id}/winner/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["team_name"], "Team Alpha")

    def test_public_tournament_winner_no_matches(self):
        empty_tournament = Tournament.objects.create(
            event=self._create_tournament_event(
                title="Empty Tournament", status=EventStatus.PUBLISHED, is_active=True
            ),
            category=self.category,
        )
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{empty_tournament.id}/winner/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_public_tournament_matches(self):
        from apps.events.services.match_service import create_match

        create_match(
            {"tournament": self.tournament, "round": "Final", "scheduled_at": timezone.now() + timezone.timedelta(days=1)}
        )
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{self.tournament.id}/matches/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["round"], "Final")

    def test_public_tournament_not_found(self):
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PublicWorkshopApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.instructor = _create_user_with_role(
            "ws_instructor@test.com", "Workshop", "Instructor", "StrongP@ssw0rd!2026",
            status="ACTIVE", is_email_verified=True, role=Roles.INSTRUCTOR, branch=self.branch,
        )
        self.workshop_event = self._create_workshop_event(
            title="Public Workshop",
            status=EventStatus.PUBLISHED,
            is_active=True,
        )
        self.workshop = Workshop.objects.create(
            event=self.workshop_event,
            instructor=self.instructor,
            duration_minutes=120,
            level="BEGINNER",
            price=50.00,
        )

    def test_list_public_workshops(self):
        response = self.client.get(f"{self.base_url}/events/workshops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_workshop_list_excludes_draft(self):
        draft_event = self._create_workshop_event(
            title="Draft Workshop", status=EventStatus.DRAFT
        )
        Workshop.objects.create(
            event=draft_event, instructor=self.instructor,
            duration_minutes=60, level="ADVANCED",
        )
        response = self.client.get(f"{self.base_url}/events/workshops/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_workshop_detail(self):
        response = self.client.get(
            f"{self.base_url}/events/workshops/{self.workshop.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["event_title"], "Public Workshop")
        self.assertEqual(response.data["instructor_name"], "Workshop Instructor")

    def test_public_workshop_detail_not_found(self):
        response = self.client.get(
            f"{self.base_url}/events/workshops/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_workshop_serializer_excludes_sensitive_fields(self):
        response = self.client.get(
            f"{self.base_url}/events/workshops/{self.workshop.id}/"
        )
        self.assertNotIn("instructor", response.data)
        self.assertNotIn("event", response.data)


class PublicEventPaginationFilterTest(EventApiTestCase):
    def test_pagination_default_page_size(self):
        for i in range(25):
            self._create_event(
                title=f"Event {i}",
                status=EventStatus.PUBLISHED,
                visibility=Visibility.PUBLIC,
            )
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])

    def test_pagination_page_size_param(self):
        for i in range(10):
            self._create_event(
                title=f"Event {i}",
                status=EventStatus.PUBLISHED,
                visibility=Visibility.PUBLIC,
            )
        response = self.client.get(
            f"{self.base_url}/events/?page_size=5"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_search_by_title(self):
        self._create_event(
            title="Robotics Competition",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        self._create_event(
            title="Art Exhibition",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        response = self.client.get(
            f"{self.base_url}/events/?search=Robotics"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Robotics Competition")

    def test_filter_by_event_type(self):
        self._create_event(
            title="General Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            event_type=EventType.GENERAL,
        )
        self._create_event(
            title="Tournament Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            event_type=EventType.TOURNAMENT,
        )
        response = self.client.get(
            f"{self.base_url}/events/?event_type=TOURNAMENT"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["event_type"], "TOURNAMENT")

    def test_order_by_title(self):
        self._create_event(
            title="Z Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        self._create_event(
            title="A Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        response = self.client.get(
            f"{self.base_url}/events/?ordering=title"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["title"], "A Event")
        self.assertEqual(response.data["results"][1]["title"], "Z Event")

    def test_order_by_start_datetime_desc(self):
        now = timezone.now()
        self._create_event(
            title="Later Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now + timezone.timedelta(days=10),
        )
        self._create_event(
            title="Earlier Event",
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
            start_datetime=now + timezone.timedelta(days=1),
        )
        response = self.client.get(
            f"{self.base_url}/events/?ordering=-start_datetime"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["title"], "Later Event")


class TournamentCategoryApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        self.category_data = {"name": "Solo", "code": "SOLO", "description": "Single player"}

    def test_create_category_as_super_admin(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-categories/",
            self.category_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Solo")

    def test_create_category_as_branch_manager(self):
        self._auth(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-categories/",
            self.category_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_category_as_student_forbidden(self):
        self._auth(self.student)
        response = self.client.post(
            f"{self.base_url}/admin/tournament-categories/",
            self.category_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_categories(self):
        self._auth(self.super_admin)
        response = self.client.get(f"{self.base_url}/admin/tournament-categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_category_detail(self):
        self._auth(self.super_admin)
        cat = self._create_category()
        response = self.client.get(
            f"{self.base_url}/admin/tournament-categories/{cat.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], cat.name)

    def test_update_category(self):
        self._auth(self.super_admin)
        cat = self._create_category()
        response = self.client.patch(
            f"{self.base_url}/admin/tournament-categories/{cat.id}/",
            {"description": "Updated description"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["description"], "Updated description")

    def test_delete_category(self):
        self._auth(self.super_admin)
        cat = self._create_category()
        response = self.client.delete(
            f"{self.base_url}/admin/tournament-categories/{cat.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def _create_category(self):
        from apps.events.models import TournamentCategory
        return TournamentCategory.objects.create(name="Team", code="TEAM")


class SecretaryRoleApiTest(EventApiTestCase):
    def setUp(self):
        super().setUp()
        from apps.accounts.permissions.roles import Roles
        self.secretary = user_service._create_user_with_role(
            "secretary@test.com", "Secretary", "User", self.password,
            status=AccountStatus.PENDING,
            is_email_verified=False,
            role=Roles.SECRETARY,
            branch=self.branch,
        )
        user_service.activate_user(self.secretary)

        event = self._create_event(
            title="Reg Event", status=EventStatus.PUBLISHED,
            registration_enabled=True, registration_mode=RegistrationMode.PUBLIC,
        )
        self.registration = EventRegistration.objects.create(
            event=event,
            public_full_name="John Doe",
            public_email="john@test.com",
            public_phone="1234567890",
        )

    def test_secretary_can_list_registrations(self):
        self._auth(self.secretary)
        response = self.client.get(f"{self.base_url}/admin/registrations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_secretary_can_approve_registration(self):
        self._auth(self.secretary)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{self.registration.id}/approve/",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.registration.refresh_from_db()
        self.assertEqual(self.registration.registration_status, RegistrationStatus.APPROVED)

    def test_secretary_can_reject_registration(self):
        self._auth(self.secretary)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{self.registration.id}/reject/",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.registration.refresh_from_db()
        self.assertEqual(self.registration.registration_status, RegistrationStatus.REJECTED)

    def test_secretary_can_cancel_registration(self):
        self._auth(self.secretary)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{self.registration.id}/cancel/",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.registration.refresh_from_db()
        self.assertEqual(self.registration.registration_status, RegistrationStatus.CANCELLED)

    def test_secretary_can_record_cash_payment(self):
        self._auth(self.secretary)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/{self.registration.id}/pay/cash/",
            {"amount": "50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_secretary_cannot_create_event(self):
        self._auth(self.secretary)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            self.valid_event_data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class NegativeEdgeCaseApiTest(EventApiTestCase):
    def test_invalid_uuid_on_event_detail(self):
        response = self.client.get(f"{self.base_url}/events/invalid-uuid/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_uuid_on_tournament_detail(self):
        response = self.client.get(f"{self.base_url}/events/tournaments/invalid-uuid/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_uuid_on_workshop_detail(self):
        response = self.client.get(f"{self.base_url}/events/workshops/invalid-uuid/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_event_empty_body(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/events/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_tournament_missing_fields(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/tournaments/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_event_list_filter_nonexistent_event_type(self):
        response = self.client.get(f"{self.base_url}/events/?event_type=NONEXISTENT")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_empty_body(self):
        event = self._create_event(
            status=EventStatus.PUBLISHED, registration_enabled=True,
            registration_mode=RegistrationMode.PUBLIC,
        )
        response = self.client.post(
            f"{self.base_url}/events/{event.id}/register/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_standings_invalid_top_param(self):
        event = self._create_tournament_event(status=EventStatus.PUBLISHED)
        category = TournamentCategory.objects.create(name="Solo", code="SOLO")
        tournament = Tournament.objects.create(event=event, category=category)
        response = self.client.get(
            f"{self.base_url}/events/tournaments/{tournament.id}/standings/?top=invalid"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_existent_registration_id_on_admin(self):
        self._auth(self.super_admin)
        fake_uuid = uuid.uuid4()
        response = self.client.get(
            f"{self.base_url}/admin/registrations/{fake_uuid}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cash_payment_invalid_uuid(self):
        self._auth(self.super_admin)
        response = self.client.post(
            f"{self.base_url}/admin/registrations/invalid-uuid/pay/cash/",
            {"amount": "50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class IntegrationApiTest(EventApiTestCase):
    def test_full_tournament_workflow(self):
        """Create tournament -> teams -> matches -> scores -> complete -> verify standings."""
        self._auth(self.super_admin)

        event_response = self.client.post(
            f"{self.base_url}/admin/events/",
            {**self.valid_event_data, "event_type": EventType.TOURNAMENT},
            format="json",
        )
        self.assertEqual(event_response.status_code, status.HTTP_201_CREATED)
        event_id = event_response.data["id"]

        category = TournamentCategory.objects.create(name="Team", code="TEAM")
        tournament_response = self.client.post(
            f"{self.base_url}/admin/tournaments/",
            {"event": event_id, "category": str(category.id)},
            format="json",
        )
        self.assertEqual(tournament_response.status_code, status.HTTP_201_CREATED)
        tournament_id = tournament_response.data["id"]

        team_a_resp = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            {"tournament": tournament_id, "team_name": "Alpha"},
            format="json",
        )
        self.assertEqual(team_a_resp.status_code, status.HTTP_201_CREATED)
        team_a_id = team_a_resp.data["id"]

        team_b_resp = self.client.post(
            f"{self.base_url}/admin/tournament-teams/",
            {"tournament": tournament_id, "team_name": "Beta"},
            format="json",
        )
        self.assertEqual(team_b_resp.status_code, status.HTTP_201_CREATED)
        team_b_id = team_b_resp.data["id"]

        match_resp = self.client.post(
            f"{self.base_url}/admin/matches/",
            {
                "tournament": tournament_id,
                "round": "Final",
                "scheduled_at": (timezone.now() + timezone.timedelta(hours=2)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(match_resp.status_code, status.HTTP_201_CREATED)
        match_id = match_resp.data["id"]

        assign_a = self.client.post(
            f"{self.base_url}/admin/matches/{match_id}/assign-team/",
            {"side": "SIDE_A", "tournament_team": team_a_id},
            format="json",
        )
        self.assertEqual(assign_a.status_code, status.HTTP_201_CREATED)

        assign_b = self.client.post(
            f"{self.base_url}/admin/matches/{match_id}/assign-team/",
            {"side": "SIDE_B", "tournament_team": team_b_id},
            format="json",
        )
        self.assertEqual(assign_b.status_code, status.HTTP_201_CREATED)

        scores_resp = self.client.post(
            f"{self.base_url}/admin/matches/{match_id}/record-scores/",
            {"side_a_score": 10, "side_b_score": 5},
            format="json",
        )
        self.assertEqual(scores_resp.status_code, status.HTTP_200_OK)

        complete_resp = self.client.post(
            f"{self.base_url}/admin/matches/{match_id}/complete/",
        )
        self.assertEqual(complete_resp.status_code, status.HTTP_200_OK)

        standings_resp = self.client.get(
            f"{self.base_url}/admin/tournaments/{tournament_id}/standings/"
        )
        self.assertEqual(standings_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(standings_resp.data), 2)
        self.assertEqual(standings_resp.data[0]["team_name"], "Alpha")

        winner_resp = self.client.get(
            f"{self.base_url}/admin/tournaments/{tournament_id}/winner/"
        )
        self.assertEqual(winner_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(winner_resp.data["team_name"], "Alpha")

        matches_resp = self.client.get(
            f"{self.base_url}/admin/tournaments/{tournament_id}/matches/"
        )
        self.assertEqual(matches_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(matches_resp.data), 1)
