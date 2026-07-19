from uuid import uuid4

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import User

from apps.events.constants import EventStatus, MatchSideType, MatchStatus, Visibility, EventType, RegistrationMode
from apps.events.models import Event, EventRegistration, Match, MatchParticipant, Tournament, TournamentCategory, TournamentTeam, Workshop
from apps.events.services.event_service import (
    create_event,
    get_event_or_404,
    list_events,
    update_event,
    delete_event,
    publish_event,
    unpublish_event,
    activate_event,
    deactivate_event,
)
from apps.events.services.tournament_service import (
    create_tournament,
    get_tournament_or_404,
    list_tournaments,
    update_tournament,
    delete_tournament,
    close_tournament,
    reopen_tournament,
)
from apps.events.services.tournament_category_service import (
    create_category,
    get_category_or_404,
    list_categories,
    update_category,
    delete_category,
)
from apps.events.services.tournament_team_service import (
    create_team,
    get_team_or_404,
    list_teams,
    update_team,
    delete_team,
)
from apps.events.services.match_service import (
    assign_team_to_side,
    complete_match,
    create_match,
    delete_match,
    get_match_or_404,
    list_matches,
    record_scores,
    remove_team_from_side,
    update_match,
)
from apps.events.services.ranking_service import (
    get_standings,
    get_tournament_winner,
    update_tournament_statistics,
)
from apps.events.services.workshop_service import (
    create_workshop,
    delete_workshop,
    get_workshop_or_404,
    list_workshops,
    update_workshop,
)
from unittest.mock import patch

from apps.events.services.registration_service import (
    approve_registration,
    cancel_registration,
    convert_registration_to_team,
    get_my_registrations,
    get_registration_or_404,
    list_registrations,
    register_for_event,
    reject_registration,
    verify_registration_email,
)
from apps.events.services.tournament_service import (
    create_tournament,
)
from apps.events.services.event_payment_service import (
    get_payment_or_404,
    list_payments,
    record_cash_payment,
)
from apps.academic.models import Student


class EventServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Event",
            "description": "Description",
            "location": "Location",
            "event_type": EventType.GENERAL,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }

    def test_create_event(self):
        event = create_event(self.valid_data)
        self.assertEqual(event.title, "Test Event")
        self.assertEqual(event.event_type, EventType.GENERAL)

    def test_create_event_invalid_dates(self):
        data = {**self.valid_data}
        data["start_datetime"] = timezone.now() + timezone.timedelta(days=2)
        data["end_datetime"] = timezone.now() + timezone.timedelta(days=1)
        with self.assertRaises(ValidationError):
            create_event(data)

    def test_create_event_registration_config_missing_mode(self):
        data = {**self.valid_data, "registration_enabled": True}
        with self.assertRaises(ValidationError):
            create_event(data)

    def test_get_event_or_404_found(self):
        event = create_event(self.valid_data)
        found = get_event_or_404(event.id)
        self.assertEqual(found.id, event.id)

    def test_get_event_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_event_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_events(self):
        create_event(self.valid_data)
        create_event({**self.valid_data, "title": "Event 2"})
        events = list_events()
        self.assertEqual(events.count(), 2)

    def test_update_event(self):
        event = create_event(self.valid_data)
        updated = update_event(event, {"title": "Updated Title"})
        self.assertEqual(updated.title, "Updated Title")

    def test_update_event_invalid_dates(self):
        event = create_event(self.valid_data)
        with self.assertRaises(ValidationError):
            update_event(
                event,
                {
                    "start_datetime": timezone.now() + timezone.timedelta(days=2),
                    "end_datetime": timezone.now() + timezone.timedelta(days=1),
                },
            )

    def test_delete_event(self):
        event = create_event(self.valid_data)
        delete_event(event)
        with self.assertRaises(NotFound):
            get_event_or_404(event.id)

    def test_publish_event(self):
        event = create_event(self.valid_data)
        published = publish_event(event)
        self.assertEqual(published.status, EventStatus.PUBLISHED)

    def test_publish_event_not_draft(self):
        event = create_event(self.valid_data)
        publish_event(event)
        with self.assertRaises(ValidationError):
            publish_event(event)

    def test_unpublish_event(self):
        event = create_event(self.valid_data)
        publish_event(event)
        unpublished = unpublish_event(event)
        self.assertEqual(unpublished.status, EventStatus.DRAFT)

    def test_unpublish_event_not_published(self):
        event = create_event(self.valid_data)
        with self.assertRaises(ValidationError):
            unpublish_event(event)

    def test_activate_event(self):
        event = create_event({**self.valid_data, "is_active": False})
        activated = activate_event(event)
        self.assertTrue(activated.is_active)

    def test_deactivate_event(self):
        event = create_event(self.valid_data)
        deactivated = deactivate_event(event)
        self.assertFalse(deactivated.is_active)


class TournamentServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Tournament",
            "description": "Tournament description",
            "location": "Arena",
            "event_type": EventType.TOURNAMENT,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }
        self.event = create_event(self.valid_data)
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament_data = {
            "event": self.event.id,
            "category": self.category.id,
            "max_teams": 16,
            "prize_pool": 1000.00,
        }

    def test_create_tournament(self):
        tournament = create_tournament({**self.tournament_data})
        self.assertEqual(tournament.category.id, self.category.id)
        self.assertEqual(tournament.max_teams, 16)
        self.assertEqual(tournament.event.id, self.event.id)

    def test_create_tournament_wrong_event_type(self):
        general_event = create_event({
            **self.valid_data,
            "title": "General Event",
            "event_type": EventType.GENERAL,
        })
        with self.assertRaises(ValidationError):
            create_tournament({"event": general_event.id, "category": self.category.id})

    def test_create_tournament_missing_event(self):
        with self.assertRaises(ValidationError):
            create_tournament({"category": self.category.id})

    def test_create_tournament_invalid_max_teams(self):
        with self.assertRaises(ValidationError):
            create_tournament({**self.tournament_data, "max_teams": 0})

    def test_get_tournament_or_404_found(self):
        tournament = create_tournament(self.tournament_data)
        found = get_tournament_or_404(tournament.id)
        self.assertEqual(found.id, tournament.id)

    def test_get_tournament_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_tournament_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_tournaments(self):
        create_tournament(self.tournament_data)
        self.assertEqual(list_tournaments().count(), 1)

    def test_update_tournament(self):
        tournament = create_tournament(self.tournament_data)
        new_category = TournamentCategory.objects.create(name="VEX V5", code="VEX_V5")
        updated = update_tournament(tournament, {"category": new_category.id})
        self.assertEqual(updated.category.id, new_category.id)

    def test_update_tournament_cannot_change_event(self):
        tournament = create_tournament(self.tournament_data)
        with self.assertRaises(ValidationError):
            update_tournament(tournament, {"event": self.event.id})

    def test_delete_tournament(self):
        tournament = create_tournament(self.tournament_data)
        delete_tournament(tournament)
        with self.assertRaises(NotFound):
            get_tournament_or_404(tournament.id)

    def test_close_tournament(self):
        tournament = create_tournament(self.tournament_data)
        closed = close_tournament(tournament)
        self.assertTrue(closed.is_closed)

    def test_close_already_closed(self):
        tournament = create_tournament(self.tournament_data)
        close_tournament(tournament)
        with self.assertRaises(ValidationError):
            close_tournament(tournament)

    def test_reopen_tournament(self):
        tournament = create_tournament(self.tournament_data)
        close_tournament(tournament)
        reopened = reopen_tournament(tournament)
        self.assertFalse(reopened.is_closed)

    def test_reopen_not_closed(self):
        tournament = create_tournament(self.tournament_data)
        with self.assertRaises(ValidationError):
            reopen_tournament(tournament)


class TournamentCategoryServiceTest(TestCase):
    def setUp(self):
        self.category_data = {
            "name": "VEX IQ",
            "code": "VEX_IQ",
            "description": "VEX IQ Competition",
        }

    def test_create_category(self):
        category = create_category(self.category_data)
        self.assertEqual(category.name, "VEX IQ")
        self.assertEqual(category.code, "VEX_IQ")

    def test_get_category_or_404_found(self):
        category = create_category(self.category_data)
        found = get_category_or_404(category.id)
        self.assertEqual(found.id, category.id)

    def test_get_category_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_category_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_categories(self):
        create_category(self.category_data)
        create_category({"name": "VEX V5", "code": "VEX_V5"})
        self.assertEqual(list_categories().count(), 2)

    def test_update_category(self):
        category = create_category(self.category_data)
        updated = update_category(category, {"name": "VEX IQ Updated"})
        self.assertEqual(updated.name, "VEX IQ Updated")

    def test_delete_category(self):
        category = create_category(self.category_data)
        delete_category(category)
        with self.assertRaises(NotFound):
            get_category_or_404(category.id)

    def test_delete_category_in_use(self):
        category = create_category(self.category_data)
        event = create_event({
            "title": "Test Tournament",
            "description": "desc",
            "location": "loc",
            "event_type": EventType.TOURNAMENT,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        })
        tournament = Tournament.objects.create(event=event, category=category)
        with self.assertRaises(ValidationError):
            delete_category(category)


class TournamentTeamServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Tournament",
            "description": "desc",
            "location": "loc",
            "event_type": EventType.TOURNAMENT,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }
        self.event = create_event(self.valid_data)
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.event,
            category=self.category,
            max_teams=10,
        )

    def test_create_team(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Robo Warriors",
        })
        self.assertEqual(team.team_name, "Robo Warriors")
        self.assertEqual(team.tournament.id, self.tournament.id)

    def test_create_team_duplicate_name(self):
        create_team({
            "tournament": self.tournament.id,
            "team_name": "Robo Warriors",
        })
        with self.assertRaises(ValidationError):
            create_team({
                "tournament": self.tournament.id,
                "team_name": "Robo Warriors",
            })

    def test_create_team_max_teams_exceeded(self):
        self.tournament.max_teams = 1
        self.tournament.save(update_fields=["max_teams"])
        create_team({
            "tournament": self.tournament.id,
            "team_name": "Team One",
        })
        with self.assertRaises(ValidationError):
            create_team({
                "tournament": self.tournament.id,
                "team_name": "Team Two",
            })

    def test_create_team_closed_tournament(self):
        self.tournament.is_closed = True
        self.tournament.save(update_fields=["is_closed"])
        with self.assertRaises(ValidationError):
            create_team({
                "tournament": self.tournament.id,
                "team_name": "Team Three",
            })

    def test_create_team_missing_tournament(self):
        with self.assertRaises(ValidationError):
            create_team({"team_name": "Orphans"})

    def test_get_team_or_404_found(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Cyber Knights",
        })
        found = get_team_or_404(team.id)
        self.assertEqual(found.id, team.id)

    def test_get_team_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_team_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_teams(self):
        create_team({"tournament": self.tournament.id, "team_name": "Team A"})
        create_team({"tournament": self.tournament.id, "team_name": "Team B"})
        self.assertEqual(list_teams().count(), 2)

    def test_list_teams_filtered_by_tournament(self):
        create_team({"tournament": self.tournament.id, "team_name": "Team A"})
        other_event = create_event({**self.valid_data, "title": "Other"})
        other_tournament = Tournament.objects.create(
            event=other_event, category=self.category
        )
        create_team({"tournament": other_tournament.id, "team_name": "Team B"})
        self.assertEqual(list_teams(tournament_id=self.tournament.id).count(), 1)

    def test_update_team(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Old Name",
        })
        updated = update_team(team, {"team_name": "New Name"})
        self.assertEqual(updated.team_name, "New Name")

    def test_update_team_duplicate_name(self):
        create_team({"tournament": self.tournament.id, "team_name": "Team One"})
        team2 = create_team({"tournament": self.tournament.id, "team_name": "Team Two"})
        with self.assertRaises(ValidationError):
            update_team(team2, {"team_name": "Team One"})

    def test_update_team_cannot_change_tournament(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Fixed Team",
        })
        with self.assertRaises(ValidationError):
            update_team(team, {"tournament": self.tournament.id})

    def test_delete_team(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Delete Me",
        })
        delete_team(team)
        with self.assertRaises(NotFound):
            get_team_or_404(team.id)

    def test_delete_team_closed_tournament(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Stuck Team",
        })
        self.tournament.is_closed = True
        self.tournament.save(update_fields=["is_closed"])
        # Refresh team's cached tournament reference from DB
        team.tournament.refresh_from_db()
        with self.assertRaises(ValidationError):
            delete_team(team)

    def test_delete_team_in_completed_match(self):
        team = create_team({
            "tournament": self.tournament.id,
            "team_name": "Locked Team",
        })
        team2 = create_team({
            "tournament": self.tournament.id,
            "team_name": "Opponent Team",
        })
        match = create_match({
            "tournament": self.tournament.id,
            "round": "Final",
            "scheduled_at": timezone.now(),
        })
        assign_team_to_side(match, MatchSideType.SIDE_A, team)
        assign_team_to_side(match, MatchSideType.SIDE_B, team2)
        record_scores(match, 10, 5)
        complete_match(match)
        with self.assertRaises(ValidationError):
            delete_team(team)


class MatchServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Tournament",
            "description": "desc",
            "location": "loc",
            "event_type": EventType.TOURNAMENT,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }
        self.event = create_event(self.valid_data)
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.event,
            category=self.category,
            max_teams=10,
        )
        self.team_a = create_team({
            "tournament": self.tournament.id,
            "team_name": "Team Alpha",
        })
        self.team_b = create_team({
            "tournament": self.tournament.id,
            "team_name": "Team Beta",
        })
        self.match_data = {
            "tournament": self.tournament.id,
            "round": "Qualification",
            "scheduled_at": timezone.now(),
        }

    def test_create_match(self):
        match = create_match({**self.match_data})
        self.assertEqual(match.round, "Qualification")
        self.assertEqual(match.status, MatchStatus.SCHEDULED)
        self.assertIsNone(match.winning_side)
        self.assertEqual(match.sides.count(), 2)

    def test_create_match_missing_tournament(self):
        with self.assertRaises(ValidationError):
            create_match({"round": "Final", "scheduled_at": timezone.now()})

    def test_create_match_missing_round(self):
        with self.assertRaises(ValidationError):
            create_match({"tournament": self.tournament.id, "scheduled_at": timezone.now()})

    def test_create_match_missing_scheduled_at(self):
        with self.assertRaises(ValidationError):
            create_match({"tournament": self.tournament.id, "round": "Final"})

    def test_create_match_closed_tournament(self):
        self.tournament.is_closed = True
        self.tournament.save(update_fields=["is_closed"])
        with self.assertRaises(ValidationError):
            create_match({**self.match_data})

    def test_get_match_or_404_found(self):
        match = create_match({**self.match_data})
        found = get_match_or_404(match.id)
        self.assertEqual(found.id, match.id)

    def test_get_match_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_match_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_matches(self):
        create_match({**self.match_data})
        create_match({
            **self.match_data,
            "round": "Final",
        })
        self.assertEqual(list_matches().count(), 2)

    def test_list_matches_filtered_by_tournament(self):
        create_match({**self.match_data})
        other_event = create_event({**self.valid_data, "title": "Other Tournament"})
        other_tournament = Tournament.objects.create(
            event=other_event, category=self.category
        )
        create_match({
            "tournament": other_tournament.id,
            "round": "Final",
            "scheduled_at": timezone.now(),
        })
        self.assertEqual(list_matches(tournament_id=self.tournament.id).count(), 1)

    def test_update_match(self):
        match = create_match({**self.match_data})
        updated = update_match(match, {"round": "Final"})
        self.assertEqual(updated.round, "Final")

    def test_update_match_cannot_change_tournament(self):
        match = create_match({**self.match_data})
        with self.assertRaises(ValidationError):
            update_match(match, {"tournament": self.tournament.id})

    def test_update_match_completed(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        complete_match(match)
        with self.assertRaises(ValidationError):
            update_match(match, {"round": "Changed"})

    def test_delete_match(self):
        match = create_match({**self.match_data})
        delete_match(match)
        with self.assertRaises(NotFound):
            get_match_or_404(match.id)

    def test_assign_team_to_side(self):
        match = create_match({**self.match_data})
        participant = assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        self.assertIsNotNone(participant)
        self.assertEqual(match.sides.get(side=MatchSideType.SIDE_A).participants.count(), 1)

    def test_assign_team_wrong_tournament(self):
        other_event = create_event({**self.valid_data, "title": "Other Event"})
        other_tournament = Tournament.objects.create(
            event=other_event, category=self.category
        )
        match = create_match({"tournament": other_tournament.id, "round": "Final", "scheduled_at": timezone.now()})
        with self.assertRaises(ValidationError):
            assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)

    def test_assign_team_duplicate(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        with self.assertRaises(ValidationError):
            assign_team_to_side(match, MatchSideType.SIDE_B, self.team_a)

    def test_assign_team_completed_match(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        complete_match(match)
        with self.assertRaises(ValidationError):
            assign_team_to_side(match, MatchSideType.SIDE_A, self.team_b)

    def test_remove_team_from_side(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        remove_team_from_side(match, MatchSideType.SIDE_A, self.team_a)
        self.assertEqual(match.sides.get(side=MatchSideType.SIDE_A).participants.count(), 0)

    def test_record_scores(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        sides = {s.side: s for s in match.sides.all()}
        self.assertEqual(sides[MatchSideType.SIDE_A].score, 10)
        self.assertEqual(sides[MatchSideType.SIDE_B].score, 5)

    def test_record_scores_completed_match(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        complete_match(match)
        with self.assertRaises(ValidationError):
            record_scores(match, 20, 15)

    def test_record_scores_negative(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        with self.assertRaises(ValidationError):
            record_scores(match, -1, 5)

    def test_complete_match_side_a_wins(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        completed = complete_match(match)
        self.assertEqual(completed.status, MatchStatus.COMPLETED)
        self.assertIsNotNone(completed.completed_at)
        self.assertEqual(completed.winning_side.side, MatchSideType.SIDE_A)

    def test_complete_match_side_b_wins(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 3, 7)
        completed = complete_match(match)
        self.assertEqual(completed.status, MatchStatus.COMPLETED)
        self.assertEqual(completed.winning_side.side, MatchSideType.SIDE_B)

    def test_complete_match_draw(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 5, 5)
        completed = complete_match(match)
        self.assertEqual(completed.status, MatchStatus.COMPLETED)
        self.assertIsNone(completed.winning_side)

    def test_complete_match_missing_teams(self):
        match = create_match({**self.match_data})
        record_scores(match, 5, 5)
        with self.assertRaises(ValidationError):
            complete_match(match)

    def test_complete_match_already_completed(self):
        match = create_match({**self.match_data})
        assign_team_to_side(match, MatchSideType.SIDE_A, self.team_a)
        assign_team_to_side(match, MatchSideType.SIDE_B, self.team_b)
        record_scores(match, 10, 5)
        complete_match(match)
        with self.assertRaises(ValidationError):
            complete_match(match)


class RankingServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Ranking Tournament",
            "description": "desc",
            "location": "loc",
            "event_type": EventType.TOURNAMENT,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }
        self.event = create_event(self.valid_data)
        self.category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        self.tournament = Tournament.objects.create(
            event=self.event,
            category=self.category,
        )
        self.team_a = create_team({
            "tournament": self.tournament.id,
            "team_name": "Team Alpha",
        })
        self.team_b = create_team({
            "tournament": self.tournament.id,
            "team_name": "Team Beta",
        })
        self.team_c = create_team({
            "tournament": self.tournament.id,
            "team_name": "Team Gamma",
        })
        self.match_data = {
            "tournament": self.tournament.id,
            "round": "Qualification",
            "scheduled_at": timezone.now(),
        }

    def _complete_match(self, side_a_teams, side_b_teams, score_a, score_b):
        """Helper to create and complete a match with given teams and scores."""
        match = create_match({**self.match_data})
        for team in side_a_teams:
            assign_team_to_side(match, MatchSideType.SIDE_A, team)
        for team in side_b_teams:
            assign_team_to_side(match, MatchSideType.SIDE_B, team)
        record_scores(match, score_a, score_b)
        return complete_match(match)

    def test_statistics_after_win(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self.team_a.refresh_from_db()
        self.team_b.refresh_from_db()
        self.assertEqual(self.team_a.wins, 1)
        self.assertEqual(self.team_a.losses, 0)
        self.assertEqual(self.team_a.points, 10)
        self.assertEqual(self.team_b.wins, 0)
        self.assertEqual(self.team_b.losses, 1)
        self.assertEqual(self.team_b.points, 5)

    def test_statistics_after_loss(self):
        self._complete_match([self.team_a], [self.team_b], 3, 8)
        self.team_a.refresh_from_db()
        self.team_b.refresh_from_db()
        self.assertEqual(self.team_a.wins, 0)
        self.assertEqual(self.team_a.losses, 1)
        self.assertEqual(self.team_a.points, 3)
        self.assertEqual(self.team_b.wins, 1)
        self.assertEqual(self.team_b.losses, 0)
        self.assertEqual(self.team_b.points, 8)

    def test_statistics_after_draw(self):
        self._complete_match([self.team_a], [self.team_b], 5, 5)
        self.team_a.refresh_from_db()
        self.team_b.refresh_from_db()
        self.assertEqual(self.team_a.draws, 1)
        self.assertEqual(self.team_a.points, 5)
        self.assertEqual(self.team_b.draws, 1)
        self.assertEqual(self.team_b.points, 5)

    def test_statistics_multiple_matches(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self._complete_match([self.team_a], [self.team_c], 7, 3)
        self.team_a.refresh_from_db()
        self.assertEqual(self.team_a.wins, 2)
        self.assertEqual(self.team_a.points, 17)

    def test_statistics_alliance_2v1(self):
        """Both teams on the winning side get credit."""
        self._complete_match([self.team_a, self.team_b], [self.team_c], 10, 4)
        self.team_a.refresh_from_db()
        self.team_b.refresh_from_db()
        self.team_c.refresh_from_db()
        self.assertEqual(self.team_a.wins, 1)
        self.assertEqual(self.team_a.points, 10)
        self.assertEqual(self.team_b.wins, 1)
        self.assertEqual(self.team_b.points, 10)
        self.assertEqual(self.team_c.losses, 1)
        self.assertEqual(self.team_c.points, 4)

    def test_get_standings_ordering(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self._complete_match([self.team_a], [self.team_c], 7, 3)
        self._complete_match([self.team_b], [self.team_c], 6, 6)
        standings = list(get_standings(self.tournament.id))
        # team_a: 17 pts, team_b: 11 pts (5+6), team_c: 9 pts (3+6)
        self.assertEqual(standings[0].id, self.team_a.id)
        self.assertEqual(standings[1].id, self.team_b.id)
        self.assertEqual(standings[2].id, self.team_c.id)

    def test_get_standings_top_n(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self._complete_match([self.team_a], [self.team_c], 7, 3)
        standings = list(get_standings(self.tournament.id, top_n=2))
        self.assertEqual(len(standings), 2)

    def test_get_tournament_winner(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self._complete_match([self.team_a], [self.team_c], 7, 3)
        winner = get_tournament_winner(self.tournament.id)
        self.assertEqual(winner.id, self.team_a.id)

    def test_get_tournament_winner_no_matches(self):
        winner = get_tournament_winner(self.tournament.id)
        self.assertIsNone(winner)

    def test_statistics_idempotent(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        update_tournament_statistics(self.tournament)
        self.team_a.refresh_from_db()
        self.assertEqual(self.team_a.wins, 1)
        self.assertEqual(self.team_a.points, 10)

    def test_statistics_reset_on_recalculation(self):
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        # Complete another match where team_b wins
        match2 = create_match({**self.match_data})
        assign_team_to_side(match2, MatchSideType.SIDE_A, self.team_b)
        assign_team_to_side(match2, MatchSideType.SIDE_B, self.team_a)
        record_scores(match2, 8, 3)
        complete_match(match2)
        self.team_a.refresh_from_db()
        self.team_b.refresh_from_db()
        # team_a: 10 pts (won first), 3 pts (lost second) = 13, 1W 1L
        # team_b: 5 pts (lost first), 8 pts (won second) = 13, 1W 1L
        self.assertEqual(self.team_a.points, 13)
        self.assertEqual(self.team_a.wins, 1)
        self.assertEqual(self.team_a.losses, 1)
        self.assertEqual(self.team_b.points, 13)
        self.assertEqual(self.team_b.wins, 1)
        self.assertEqual(self.team_b.losses, 1)

    def test_statistics_unaffected_team(self):
        """Team not in any completed match should have 0 stats."""
        self._complete_match([self.team_a], [self.team_b], 10, 5)
        self.team_c.refresh_from_db()
        self.assertEqual(self.team_c.wins, 0)
        self.assertEqual(self.team_c.losses, 0)
        self.assertEqual(self.team_c.draws, 0)
        self.assertEqual(self.team_c.points, 0)


class WorkshopServiceTest(TestCase):
    def setUp(self):
        self.valid_data = {
            "title": "Test Workshop",
            "description": "Workshop description",
            "location": "Room A",
            "event_type": EventType.WORKSHOP,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.DRAFT,
        }
        self.event = create_event(self.valid_data)
        self.instructor = User.objects.create_user(
            email="instructor@test.com",
            password="Pass1234!",
            first_name="John",
            last_name="Doe",
        )
        self.workshop_data = {
            "event": self.event.id,
            "instructor": self.instructor.id,
            "duration_minutes": 120,
            "level": "BEGINNER",
            "price": 50.00,
        }

    def test_create_workshop(self):
        workshop = create_workshop({**self.workshop_data})
        self.assertEqual(workshop.duration_minutes, 120)
        self.assertEqual(workshop.level, "BEGINNER")
        self.assertEqual(workshop.event.id, self.event.id)
        self.assertEqual(workshop.instructor.id, self.instructor.id)

    def test_create_workshop_wrong_event_type(self):
        general_event = create_event({
            **self.valid_data,
            "title": "General",
            "event_type": EventType.GENERAL,
        })
        with self.assertRaises(ValidationError):
            create_workshop({**self.workshop_data, "event": general_event.id})

    def test_create_workshop_missing_event(self):
        with self.assertRaises(ValidationError):
            create_workshop({"instructor": self.instructor.id, "duration_minutes": 60, "level": "BEGINNER"})

    def test_create_workshop_missing_instructor(self):
        with self.assertRaises(ValidationError):
            create_workshop({"event": self.event.id, "duration_minutes": 60, "level": "BEGINNER"})

    def test_create_workshop_invalid_duration(self):
        with self.assertRaises(ValidationError):
            create_workshop({**self.workshop_data, "duration_minutes": 0})

    def test_get_workshop_or_404_found(self):
        workshop = create_workshop(self.workshop_data)
        found = get_workshop_or_404(workshop.id)
        self.assertEqual(found.id, workshop.id)

    def test_get_workshop_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_workshop_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_workshops(self):
        create_workshop(self.workshop_data)
        self.assertEqual(list_workshops().count(), 1)

    def test_list_workshops_filtered_by_instructor(self):
        create_workshop(self.workshop_data)
        other_instructor = User.objects.create_user(
            email="other@test.com", password="Pass1234!"
        )
        other_event = create_event({
            **self.valid_data, "title": "Other Workshop",
        })
        create_workshop({
            "event": other_event.id,
            "instructor": other_instructor.id,
            "duration_minutes": 60,
            "level": "ADVANCED",
        })
        self.assertEqual(list_workshops(user=self.instructor).count(), 1)
        self.assertEqual(list_workshops(user=other_instructor).count(), 1)

    def test_update_workshop(self):
        workshop = create_workshop(self.workshop_data)
        updated = update_workshop(workshop, {"duration_minutes": 180})
        self.assertEqual(updated.duration_minutes, 180)

    def test_update_workshop_cannot_change_event(self):
        workshop = create_workshop(self.workshop_data)
        with self.assertRaises(ValidationError):
            update_workshop(workshop, {"event": self.event.id})

    def test_update_workshop_instructor(self):
        workshop = create_workshop(self.workshop_data)
        new_instructor = User.objects.create_user(
            email="newinst@test.com", password="Pass1234!"
        )
        updated = update_workshop(workshop, {"instructor": new_instructor.id})
        self.assertEqual(updated.instructor.id, new_instructor.id)

    def test_delete_workshop(self):
        workshop = create_workshop(self.workshop_data)
        delete_workshop(workshop)
        with self.assertRaises(NotFound):
            get_workshop_or_404(workshop.id)


class RegistrationServiceTest(TestCase):
    def setUp(self):
        from apps.events.constants import RegistrationMode
        from apps.accounts.models import Branch

        self.branch = Branch.objects.create(name="Test Branch", code="TB01")
        self.valid_data = {
            "title": "Test Event",
            "description": "Description",
            "location": "Location",
            "event_type": EventType.GENERAL,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.PUBLISHED,
            "is_active": True,
            "registration_enabled": True,
            "registration_mode": RegistrationMode.STUDENT,
        }
        self.event = create_event(self.valid_data)
        self.student_user = User.objects.create_user(
            email="student@test.com", password="Pass1234!",
            first_name="Test", last_name="Student",
        )
        self.student = Student.objects.create(
            user=self.student_user,
            branch=self.branch,
            date_joined=timezone.now().date(),
        )

    def _make_public_event(self):
        from apps.events.constants import RegistrationMode
        self.event.registration_mode = RegistrationMode.PUBLIC
        self.event.save(update_fields=["registration_mode"])

    def _make_tournament_event(self):
        self.event.event_type = EventType.TOURNAMENT
        self.event.save(update_fields=["event_type"])
        category = TournamentCategory.objects.create(name="VEX IQ", code="VEX_IQ")
        return Tournament.objects.create(event=self.event, category=category)

    def test_register_student(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        self.assertEqual(registration.event.id, self.event.id)
        self.assertEqual(registration.student.id, self.student.id)
        self.assertEqual(registration.registration_status, "PENDING")

    def test_register_public(self):
        self._make_public_event()
        data = {
            "public_full_name": "John Public",
            "public_email": "john@example.com",
            "public_phone": "+1234567890",
        }
        registration = register_for_event(self.event.id, data)
        self.assertEqual(registration.public_full_name, "John Public")
        self.assertEqual(registration.public_email, "john@example.com")
        self.assertEqual(registration.registration_status, "PENDING_EMAIL_VERIFICATION")

    def test_register_public_missing_fields(self):
        self._make_public_event()
        with self.assertRaises(ValidationError):
            register_for_event(self.event.id, {"public_full_name": "Incomplete"})

    def test_register_student_wrong_mode(self):
        self._make_public_event()
        with self.assertRaises(ValidationError):
            register_for_event(self.event.id, {"student": str(self.student.id)})

    def test_register_public_wrong_mode(self):
        event = create_event({**self.valid_data, "title": "Student Only"})
        with self.assertRaises(ValidationError):
            register_for_event(event.id, {
                "public_full_name": "John", "public_email": "john@test.com",
                "public_phone": "+123",
            })

    def test_register_registration_disabled(self):
        event = Event.objects.create(
            title="No Reg", description="desc", location="loc",
            event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.PUBLISHED,
            is_active=True, registration_enabled=False,
            registration_mode=None,
        )
        with self.assertRaises(ValidationError):
            register_for_event(event.id, {"student": str(self.student.id)})

    def test_register_capacity_full(self):
        event = create_event({**self.valid_data, "title": "Full Event", "capacity": 1, "enrolled_count": 1})
        with self.assertRaises(ValidationError):
            register_for_event(event.id, {"student": str(self.student.id)})

    @patch("apps.events.services.registration_service.get_random_string", return_value="654321")
    def test_verify_email_success(self, _mock_get_random):
        self._make_public_event()
        registration = register_for_event(
            self.event.id,
            {"public_full_name": "Test", "public_email": "test@example.com", "public_phone": "+123"},
        )
        self.assertEqual(registration.registration_status, "PENDING_EMAIL_VERIFICATION")
        self.assertIsNotNone(registration.email_verification_otp)

        verified = verify_registration_email(registration.id, "654321")
        self.assertEqual(verified.registration_status, "PENDING")
        self.assertIsNone(verified.email_verification_otp)
        self.assertIsNone(verified.email_verification_otp_expiry)

    def test_verify_email_wrong_otp(self):
        self._make_public_event()
        registration = register_for_event(
            self.event.id,
            {"public_full_name": "Test", "public_email": "test@example.com", "public_phone": "+123"},
        )
        with self.assertRaises(ValidationError):
            verify_registration_email(registration.id, "000000")

    def test_verify_email_expired_otp(self):
        self._make_public_event()
        registration = register_for_event(
            self.event.id,
            {"public_full_name": "Test", "public_email": "test@example.com", "public_phone": "+123"},
        )
        registration.email_verification_otp_expiry = timezone.now() - timezone.timedelta(minutes=1)
        registration.save(update_fields=["email_verification_otp_expiry"])
        with self.assertRaises(ValidationError):
            verify_registration_email(registration.id, "000000")

    def test_verify_email_not_found(self):
        with self.assertRaises(NotFound):
            verify_registration_email(uuid4(), "123456")

    def test_verify_email_wrong_status(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        self.assertEqual(registration.registration_status, "PENDING")
        with self.assertRaises(ValidationError):
            verify_registration_email(registration.id, "123456")

    def test_register_duplicate_student(self):
        register_for_event(self.event.id, {"student": str(self.student.id)})
        with self.assertRaises(ValidationError):
            register_for_event(self.event.id, {"student": str(self.student.id)})

    def test_register_duplicate_public_email(self):
        self._make_public_event()
        data = {"public_full_name": "John", "public_email": "john@test.com", "public_phone": "+123"}
        register_for_event(self.event.id, data)
        with self.assertRaises(ValidationError):
            register_for_event(self.event.id, data)

    def test_register_deadline_passed(self):
        event = Event.objects.create(
            title="Late Event", description="desc", location="loc",
            event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.PUBLISHED,
            is_active=True, registration_enabled=True,
            registration_mode="STUDENT",
            registration_deadline=timezone.now() - timezone.timedelta(hours=1),
        )
        with self.assertRaises(ValidationError):
            register_for_event(event.id, {"student": str(self.student.id)})

    def test_register_not_published(self):
        event = create_event({
            **self.valid_data, "title": "Draft Event",
            "status": EventStatus.DRAFT,
        })
        with self.assertRaises(ValidationError):
            register_for_event(event.id, {"student": str(self.student.id)})

    def test_get_registration_or_404_found(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        found = get_registration_or_404(registration.id)
        self.assertEqual(found.id, registration.id)

    def test_get_registration_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_registration_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_registrations(self):
        register_for_event(self.event.id, {"student": str(self.student.id)})
        self.assertEqual(list_registrations().count(), 1)

    def test_list_registrations_filtered_by_event(self):
        other_event = create_event({**self.valid_data, "title": "Other Event"})
        register_for_event(self.event.id, {"student": str(self.student.id)})
        other_user = User.objects.create_user(
            email="other@test.com", password="Pass1234!"
        )
        other_student = Student.objects.create(user=other_user, branch=self.branch, date_joined=timezone.now().date())
        register_for_event(other_event.id, {"student": str(other_student.id)})
        self.assertEqual(list_registrations(event_id=self.event.id).count(), 1)

    def test_approve_registration(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approved = approve_registration(registration)
        self.assertEqual(approved.registration_status, "APPROVED")
        self.assertIsNotNone(approved.approved_at)
        self.event.refresh_from_db()
        self.assertEqual(self.event.enrolled_count, 1)

    def test_approve_registration_capacity(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        self.event.capacity = 0
        self.event.save(update_fields=["capacity"])
        registration.event.refresh_from_db()
        with self.assertRaises(ValidationError):
            approve_registration(registration)

    def test_approve_already_approved(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approve_registration(registration)
        with self.assertRaises(ValidationError):
            approve_registration(registration)

    def test_reject_registration(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        rejected = reject_registration(registration)
        self.assertEqual(rejected.registration_status, "REJECTED")

    def test_reject_already_rejected(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        reject_registration(registration)
        with self.assertRaises(ValidationError):
            reject_registration(registration)

    def test_cancel_registration(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        cancelled = cancel_registration(registration)
        self.assertEqual(cancelled.registration_status, "CANCELLED")
        self.assertIsNotNone(cancelled.cancelled_at)

    def test_cancel_registration_decrements_enrolled(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approve_registration(registration)
        self.event.refresh_from_db()
        self.assertEqual(self.event.enrolled_count, 1)
        cancel_registration(registration)
        self.event.refresh_from_db()
        self.assertEqual(self.event.enrolled_count, 0)

    def test_cancel_twice(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        cancel_registration(registration)
        with self.assertRaises(ValidationError):
            cancel_registration(registration)

    def test_convert_registration_to_team(self):
        tournament = self._make_tournament_event()
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approve_registration(registration)
        team = convert_registration_to_team(registration, "Robo Warriors")
        self.assertEqual(team.team_name, "Robo Warriors")
        self.assertEqual(team.registration.id, registration.id)
        self.assertEqual(team.tournament.id, tournament.id)

    def test_convert_not_approved(self):
        self._make_tournament_event()
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        with self.assertRaises(ValidationError):
            convert_registration_to_team(registration, "Robo Warriors")

    def test_convert_not_tournament(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approve_registration(registration)
        with self.assertRaises(ValidationError):
            convert_registration_to_team(registration, "Robo Warriors")

    def test_convert_duplicate(self):
        self._make_tournament_event()
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        approve_registration(registration)
        convert_registration_to_team(registration, "Robo Warriors")
        with self.assertRaises(ValidationError):
            convert_registration_to_team(registration, "Robo Warriors 2")

    def test_get_my_registrations(self):
        registration = register_for_event(self.event.id, {"student": str(self.student.id)})
        registrations = list(get_my_registrations(self.student.id))
        self.assertGreater(len(registrations), 0)
        self.assertIn(registration, registrations)

    def test_get_my_registrations_no_results(self):
        from uuid import uuid4
        result = list(get_my_registrations(uuid4()))
        self.assertEqual(len(result), 0)


class EventPaymentServiceTest(TestCase):
    def setUp(self):
        from apps.events.constants import RegistrationMode
        from apps.accounts.models import Branch

        self.branch = Branch.objects.create(name="Test Branch", code="TB01")
        self.valid_data = {
            "title": "Test Event",
            "description": "Description",
            "location": "Location",
            "event_type": EventType.GENERAL,
            "start_datetime": timezone.now() + timezone.timedelta(days=1),
            "end_datetime": timezone.now() + timezone.timedelta(days=2),
            "visibility": Visibility.PUBLIC,
            "status": EventStatus.PUBLISHED,
            "is_active": True,
            "registration_enabled": True,
            "registration_mode": RegistrationMode.PUBLIC,
        }
        self.event = create_event(self.valid_data)
        self.registration = EventRegistration.objects.create(
            event=self.event,
            public_full_name="John Public",
            public_email="john@example.com",
            public_phone="+1234567890",
            registration_status="PENDING",
        )

    def test_record_cash_payment(self):
        payment = record_cash_payment(self.registration, 100.00)
        self.assertEqual(payment.amount, 100.00)
        self.assertEqual(payment.payment_method, "CASH")
        self.assertEqual(payment.status, "VERIFIED")
        self.assertIsNotNone(payment.payment_date)
        self.registration.refresh_from_db()
        self.assertEqual(self.registration.payment_status, "VERIFIED")

    def test_record_cash_payment_duplicate(self):
        record_cash_payment(self.registration, 100.00)
        with self.assertRaises(ValidationError):
            record_cash_payment(self.registration, 100.00)

    def test_record_cash_payment_negative_amount(self):
        with self.assertRaises(ValidationError):
            record_cash_payment(self.registration, -10)

    def test_record_cash_payment_zero_amount(self):
        with self.assertRaises(ValidationError):
            record_cash_payment(self.registration, 0)

    def test_get_payment_or_404_found(self):
        payment = record_cash_payment(self.registration, 100.00)
        found = get_payment_or_404(payment.id)
        self.assertEqual(found.id, payment.id)

    def test_get_payment_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_payment_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_payments(self):
        record_cash_payment(self.registration, 100.00)
        self.assertEqual(list_payments().count(), 1)

    def test_list_payments_filtered_by_registration(self):
        registration2 = EventRegistration.objects.create(
            event=self.event,
            public_full_name="Jane Public",
            public_email="jane@example.com",
            public_phone="+9876543210",
            registration_status="PENDING",
        )
        record_cash_payment(self.registration, 100.00)
        record_cash_payment(registration2, 200.00)
        self.assertEqual(
            list_payments(registration_id=self.registration.id).count(), 1
        )


