from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.events.constants import EventStatus, Visibility, EventType, RegistrationMode
from apps.events.models import Event, Tournament, TournamentCategory, TournamentTeam
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
