import uuid

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.events.constants import EventStatus, MatchSideType, MatchStatus, Visibility, EventType
from apps.events.models import Event, Match, Tournament, TournamentCategory, TournamentTeam
from apps.events.services.match_service import (
    assign_team_to_side,
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


class PublicEventApiTest(EventApiTestCase):
    def test_list_public_events(self):
        self._create_event(status=EventStatus.PUBLISHED, visibility=Visibility.PUBLIC)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_public_events_excludes_draft(self):
        self._create_event(status=EventStatus.DRAFT)
        response = self.client.get(f"{self.base_url}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

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
        self.assertEqual(len(response.data), 1)

    def test_upcoming_events(self):
        self._create_event(
            status=EventStatus.PUBLISHED,
            visibility=Visibility.PUBLIC,
        )
        response = self.client.get(f"{self.base_url}/events/upcoming/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

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
        self.assertEqual(len(response.data), 1)


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
