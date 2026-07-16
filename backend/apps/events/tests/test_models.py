from uuid import UUID

from django.test import TestCase
from django.utils import timezone

from apps.events.constants import EventStatus, Visibility, EventType, MatchSideType, MatchStatus, RegistrationMode, RegistrationStatus
from apps.events.models import Event, Tournament, TournamentCategory, TournamentTeam, Match, MatchSide, MatchParticipant, Workshop, EventRegistration, EventPayment


class EventModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Test Event",
            description="A test event description.",
            location="Test Location",
            event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )

    def test_create_event(self):
        self.assertEqual(str(self.event), "Test Event")
        self.assertEqual(self.event.event_type, EventType.GENERAL)
        self.assertEqual(self.event.status, EventStatus.DRAFT)

    def test_event_defaults(self):
        self.assertTrue(self.event.is_active)
        self.assertFalse(self.event.registration_enabled)
        self.assertFalse(self.event.payment_required)
        self.assertEqual(self.event.enrolled_count, 0)

    def test_event_uuid_pk(self):
        self.assertIsInstance(self.event.id, UUID)

    def test_event_timestamps(self):
        self.assertIsNotNone(self.event.created_at)
        self.assertIsNotNone(self.event.updated_at)


class TournamentCategoryModelTest(TestCase):
    def setUp(self):
        self.category = TournamentCategory.objects.create(
            name="Solo",
            code="SOLO",
            description="Single player category",
        )

    def test_create_category(self):
        self.assertEqual(str(self.category), "Solo")
        self.assertEqual(self.category.code, "SOLO")

    def test_category_defaults(self):
        self.assertTrue(self.category.is_active)

    def test_category_uuid_pk(self):
        self.assertIsInstance(self.category.id, UUID)


class TournamentModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Tournament Event",
            description="A tournament",
            location="Test",
            event_type=EventType.TOURNAMENT,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )
        self.category = TournamentCategory.objects.create(name="Team", code="TEAM")
        self.tournament = Tournament.objects.create(
            event=self.event,
            category=self.category,
            max_teams=8,
            prize_pool="1000.00",
        )

    def test_create_tournament(self):
        expected = f"{self.event.title} ({self.category.name})"
        self.assertEqual(str(self.tournament), expected)
        self.assertEqual(self.tournament.max_teams, 8)

    def test_tournament_defaults(self):
        self.assertFalse(self.tournament.is_closed)

    def test_tournament_uuid_pk(self):
        self.assertIsInstance(self.tournament.id, UUID)


class WorkshopModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Workshop Event",
            description="A workshop",
            location="Test",
            event_type=EventType.WORKSHOP,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )
        from apps.accounts.models import User
        self.instructor = User.objects.create_user(
            email="instr@test.com", password="test1234",
            first_name="Inst", last_name="Rctor",
        )
        self.workshop = Workshop.objects.create(
            event=self.event,
            instructor=self.instructor,
            duration_minutes=90,
            level="BEGINNER",
            price="50.00",
        )

    def test_create_workshop(self):
        expected = f"{self.event.title} (BEGINNER)"
        self.assertEqual(str(self.workshop), expected)
        self.assertEqual(self.workshop.duration_minutes, 90)

    def test_workshop_uuid_pk(self):
        self.assertIsInstance(self.workshop.id, UUID)


class TournamentTeamModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Team Event",
            description="For teams",
            location="Test",
            event_type=EventType.TOURNAMENT,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )
        self.category = TournamentCategory.objects.create(name="Team", code="TEAM")
        self.tournament = Tournament.objects.create(event=self.event, category=self.category)
        self.team = TournamentTeam.objects.create(
            tournament=self.tournament,
            team_name="Alpha",
        )

    def test_create_team(self):
        expected = f"Alpha ({self.event.title})"
        self.assertEqual(str(self.team), expected)

    def test_team_defaults(self):
        self.assertEqual(self.team.wins, 0)
        self.assertEqual(self.team.losses, 0)
        self.assertEqual(self.team.draws, 0)
        self.assertEqual(self.team.points, 0)

    def test_team_uuid_pk(self):
        self.assertIsInstance(self.team.id, UUID)

    def test_unique_constraint_tournament_team_name(self):
        with self.assertRaises(Exception):
            TournamentTeam.objects.create(
                tournament=self.tournament,
                team_name="Alpha",
            )


class MatchModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Match Event",
            description="For matches",
            location="Test",
            event_type=EventType.TOURNAMENT,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC,
            status=EventStatus.DRAFT,
        )
        self.category = TournamentCategory.objects.create(name="Team", code="TEAM")
        self.tournament = Tournament.objects.create(event=self.event, category=self.category)
        self.match = Match.objects.create(
            tournament=self.tournament,
            round="Final",
            scheduled_at=timezone.now() + timezone.timedelta(hours=2),
        )

    def test_create_match(self):
        expected = f"{self.event.title} - Final ({MatchStatus.SCHEDULED})"
        self.assertEqual(str(self.match), expected)
        self.assertEqual(self.match.round, "Final")

    def test_match_defaults(self):
        self.assertEqual(self.match.status, MatchStatus.SCHEDULED)
        self.assertIsNone(self.match.started_at)
        self.assertIsNone(self.match.completed_at)
        self.assertIsNone(self.match.winning_side)

    def test_match_uuid_pk(self):
        self.assertIsInstance(self.match.id, UUID)


class MatchSideModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Side Event", description="For sides",
            location="Test", event_type=EventType.TOURNAMENT,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
        )
        self.category = TournamentCategory.objects.create(name="Team", code="TEAM")
        self.tournament = Tournament.objects.create(event=self.event, category=self.category)
        self.match = Match.objects.create(
            tournament=self.tournament, round="Final",
            scheduled_at=timezone.now() + timezone.timedelta(hours=2),
        )
        self.side = MatchSide.objects.create(match=self.match, side=MatchSideType.SIDE_A)

    def test_create_side(self):
        self.assertEqual(str(self.side), "SIDE_A (0)")

    def test_side_defaults(self):
        self.assertEqual(self.side.score, 0)

    def test_unique_constraint_match_side(self):
        with self.assertRaises(Exception):
            MatchSide.objects.create(match=self.match, side=MatchSideType.SIDE_A)

    def test_side_uuid_pk(self):
        self.assertIsInstance(self.side.id, UUID)


class MatchParticipantModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Participant Event", description="For participants",
            location="Test", event_type=EventType.TOURNAMENT,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.DRAFT,
        )
        self.category = TournamentCategory.objects.create(name="Team", code="TEAM")
        self.tournament = Tournament.objects.create(event=self.event, category=self.category)
        self.team = TournamentTeam.objects.create(tournament=self.tournament, team_name="Team A")
        self.match = Match.objects.create(
            tournament=self.tournament, round="Final",
            scheduled_at=timezone.now() + timezone.timedelta(hours=2),
        )
        self.side = MatchSide.objects.create(match=self.match, side=MatchSideType.SIDE_A)
        self.participant = MatchParticipant.objects.create(
            match_side=self.side, tournament_team=self.team,
        )

    def test_create_participant(self):
        expected = f"Team A in SIDE_A"
        self.assertEqual(str(self.participant), expected)

    def test_unique_constraint_match_side_team(self):
        with self.assertRaises(Exception):
            MatchParticipant.objects.create(
                match_side=self.side, tournament_team=self.team,
            )

    def test_participant_uuid_pk(self):
        self.assertIsInstance(self.participant.id, UUID)


class EventRegistrationModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Reg Event", description="For registration",
            location="Test", event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.PUBLISHED,
        )
        self.registration = EventRegistration.objects.create(
            event=self.event,
            public_full_name="John Doe",
            public_email="john@test.com",
            public_phone="1234567890",
        )

    def test_create_registration(self):
        expected = f"{self.event.title} - john@test.com ({RegistrationStatus.PENDING})"
        self.assertEqual(str(self.registration), expected)

    def test_registration_defaults(self):
        self.assertEqual(self.registration.registration_status, RegistrationStatus.PENDING)
        self.assertEqual(self.registration.payment_status, "PENDING_VERIFICATION")

    def test_registration_uuid_pk(self):
        self.assertIsInstance(self.registration.id, UUID)

    def test_unique_constraint_event_public_email(self):
        with self.assertRaises(Exception):
            EventRegistration.objects.create(
                event=self.event,
                public_full_name="Jane Doe",
                public_email="john@test.com",
                public_phone="0987654321",
            )


class EventPaymentModelTest(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Pay Event", description="For payment",
            location="Test", event_type=EventType.GENERAL,
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            visibility=Visibility.PUBLIC, status=EventStatus.PUBLISHED,
        )
        self.registration = EventRegistration.objects.create(
            event=self.event,
            public_full_name="John Doe",
            public_email="john@test.com",
            public_phone="1234567890",
        )
        self.payment = EventPayment.objects.create(
            registration=self.registration,
            amount="100.00",
            payment_method="CASH",
        )

    def test_create_payment(self):
        expected = f"Payment for {self.registration} — Pending Verification"
        self.assertEqual(str(self.payment), expected)
    
    def test_payment_defaults(self):
        self.assertEqual(self.payment.status, "PENDING_VERIFICATION")

    def test_payment_uuid_pk(self):
        self.assertIsInstance(self.payment.id, UUID)
