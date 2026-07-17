from django.test import TestCase
from django.db import IntegrityError

from apps.cms.models import (
    HeroBanner,
    NewsArticle,
    Partner,
    AboutUs,
    ContactRequest,
    FAQ,
    MapNode,
    Gallery,
)
from apps.cms.constants import (
    NewsType,
    PartnerType,
    ContactStatus,
    ContactPriority,
    MapNodeCategory,
)


class HeroBannerModelTest(TestCase):
    def test_create_hero_banner(self):
        banner = HeroBanner.objects.create(
            title="Test Banner",
            subtitle="Subtitle",
            description="Description",
            video_url="https://example.com/video",
            button_text="Learn More",
            button_url="https://example.com",
        )
        self.assertEqual(str(banner), "Test Banner")
        self.assertTrue(banner.is_active)
        self.assertIsNotNone(banner.id)
        self.assertIsNotNone(banner.created_at)
        self.assertIsNotNone(banner.updated_at)

    def test_hero_banner_defaults(self):
        banner = HeroBanner.objects.create(
            title="Minimal Banner",
            video_url="https://example.com/video",
        )
        self.assertEqual(banner.subtitle, "")
        self.assertEqual(banner.description, "")
        self.assertFalse(banner.image)
        self.assertIsNone(banner.button_text)
        self.assertIsNone(banner.button_url)
        self.assertTrue(banner.is_active)


class NewsArticleModelTest(TestCase):
    def test_create_news_article(self):
        article = NewsArticle.objects.create(
            title="Test News",
            slug="test-news",
            content="Content here",
            type=NewsType.NEWS,
        )
        self.assertEqual(str(article), "Test News")
        self.assertEqual(article.type, NewsType.NEWS)
        self.assertTrue(article.is_active)

    def test_news_type_choices(self):
        article = NewsArticle.objects.create(
            title="Announcement",
            slug="announcement",
            content="Content",
            type=NewsType.ANNOUNCEMENT,
        )
        self.assertEqual(article.type, NewsType.ANNOUNCEMENT)

    def test_unique_slug(self):
        NewsArticle.objects.create(title="One", slug="same-slug", content="A")
        with self.assertRaises(IntegrityError):
            NewsArticle.objects.create(title="Two", slug="same-slug", content="B")


class PartnerModelTest(TestCase):
    def test_create_partner(self):
        partner = Partner.objects.create(
            title="Test Partner",
            type=PartnerType.PARTNER,
        )
        self.assertEqual(str(partner), "Test Partner")
        self.assertEqual(partner.type, PartnerType.PARTNER)

    def test_partner_type_choices(self):
        sponsor = Partner.objects.create(title="Sponsor", type=PartnerType.SPONSOR)
        self.assertEqual(sponsor.type, PartnerType.SPONSOR)


class AboutUsModelTest(TestCase):
    def test_create_about_us(self):
        about = AboutUs.objects.create(
            title="Our Mission",
            slug="our-mission",
            description="Mission description",
            mission="Our mission is to teach STEM",
            vision="A world of innovators",
        )
        self.assertEqual(str(about), "Our Mission")
        self.assertEqual(about.mission, "Our mission is to teach STEM")
        self.assertEqual(about.vision, "A world of innovators")
        self.assertFalse(about.image)

    def test_default_mission_vision_blank(self):
        about = AboutUs.objects.create(
            title="Minimal", slug="minimal", description="Desc",
        )
        self.assertEqual(about.mission, "")
        self.assertEqual(about.vision, "")

    def test_unique_slug(self):
        AboutUs.objects.create(title="One", slug="same", description="A")
        with self.assertRaises(IntegrityError):
            AboutUs.objects.create(title="Two", slug="same", description="B")


class ContactRequestModelTest(TestCase):
    def test_create_contact_request(self):
        cr = ContactRequest.objects.create(
            name="John Doe",
            email="john@example.com",
            subject="Need help",
            description="Please assist with registration.",
        )
        self.assertIsNotNone(cr.id)
        self.assertIsNotNone(cr.ticket_number)
        self.assertTrue(cr.ticket_number.startswith("CR-"))
        self.assertEqual(cr.status, ContactStatus.OPEN)
        self.assertEqual(cr.priority, ContactPriority.MEDIUM)
        self.assertIsNone(cr.phone)
        self.assertFalse(cr.attachment)
        self.assertEqual(str(cr), f"{cr.ticket_number} - Need help")

    def test_ticket_number_unique(self):
        cr1 = ContactRequest.objects.create(
            name="A", email="a@a.com", subject="S1", description="D1"
        )
        with self.assertRaises(IntegrityError):
            ContactRequest.objects.create(
                ticket_number=cr1.ticket_number, name="B", email="b@b.com",
                subject="S2", description="D2"
            )

    def test_all_statuses(self):
        for status in ContactStatus.values:
            cr = ContactRequest.objects.create(
                name="Tester", email="t@t.com", subject="Status test",
                description="Desc", status=status,
            )
            self.assertEqual(cr.status, status)

    def test_all_priorities(self):
        for priority in ContactPriority.values:
            cr = ContactRequest.objects.create(
                name="Tester", email="t@t.com", subject="Priority test",
                description="Desc", priority=priority,
            )
            self.assertEqual(cr.priority, priority)

    def test_phone_optional(self):
        cr = ContactRequest.objects.create(
            name="No Phone", email="nophone@t.com", subject="Phone test",
            description="Desc",
        )
        self.assertIsNone(cr.phone)

    def test_phone_provided(self):
        cr = ContactRequest.objects.create(
            name="With Phone", email="phon@t.com", subject="Phone test",
            description="Desc", phone="+251911234567",
        )
        self.assertEqual(cr.phone, "+251911234567")

    def test_ordering_newest_first(self):
        cr1 = ContactRequest.objects.create(
            name="First", email="f@t.com", subject="Order",
            description="Desc",
        )
        cr2 = ContactRequest.objects.create(
            name="Second", email="s@t.com", subject="Order",
            description="Desc",
        )
        qs = ContactRequest.objects.all()
        self.assertEqual(qs[0].id, cr2.id)
        self.assertEqual(qs[1].id, cr1.id)


class FAQModelTest(TestCase):
    def test_create_faq(self):
        faq = FAQ.objects.create(
            question="What is this?",
            answer="This is a FAQ.",
        )
        self.assertEqual(str(faq), "What is this?")
        self.assertTrue(faq.is_active)


class GalleryModelTest(TestCase):
    """Model-level tests for Gallery."""

    def test_create_gallery_item(self):
        item = Gallery.objects.create(
            title="Test Photo",
            description="A nice photo",
            video_url="https://example.com/video",
        )
        self.assertEqual(str(item), "Test Photo")
        self.assertEqual(item.description, "A nice photo")
        self.assertEqual(item.video_url, "https://example.com/video")
        self.assertTrue(item.is_active)
        self.assertIsNotNone(item.id)
        self.assertIsNotNone(item.created_at)
        self.assertIsNotNone(item.updated_at)

    def test_default_description_blank(self):
        item = Gallery.objects.create(title="No Desc")
        self.assertEqual(item.description, "")

    def test_default_is_active_true(self):
        item = Gallery.objects.create(title="Active by Default")
        self.assertTrue(item.is_active)

    def test_nullable_fields(self):
        item = Gallery.objects.create(title="Minimal")
        self.assertFalse(item.image)
        self.assertIsNone(item.video_url)

    def test_ordering_newest_first(self):
        old = Gallery.objects.create(title="Older")
        new = Gallery.objects.create(title="Newer")
        qs = Gallery.objects.all()
        self.assertEqual(qs[0].id, new.id)
        self.assertEqual(qs[1].id, old.id)


class MapNodeModelTest(TestCase):
    """Model-level tests for MapNode."""

    def test_create_map_node(self):
        node = MapNode.objects.create(
            city="Addis Ababa",
            country="Ethiopia",
            title="Robotics Championship 2025",
            achievement="Won first place in national finals.",
            x=45.5,
            y=30.2,
            lat="8.9806\u00b0 N",
            lng="38.7578\u00b0 E",
            category=MapNodeCategory.CHAMPIONSHIP,
        )
        self.assertEqual(str(node), "Robotics Championship 2025")
        self.assertEqual(node.city, "Addis Ababa")
        self.assertEqual(node.country, "Ethiopia")
        self.assertEqual(node.category, MapNodeCategory.CHAMPIONSHIP)
        self.assertEqual(node.x, 45.5)
        self.assertEqual(node.y, 30.2)
        self.assertTrue(node.is_active)
        self.assertIsNotNone(node.id)
        self.assertIsNotNone(node.created_at)
        self.assertIsNotNone(node.updated_at)

    def test_all_category_choices(self):
        for category in MapNodeCategory.values:
            node = MapNode.objects.create(
                city="City",
                country="Country",
                title=f"Node {category}",
                achievement="Achievement",
                x=10.0,
                y=20.0,
                category=category,
            )
            self.assertEqual(node.category, category)

    def test_default_is_active_true(self):
        node = MapNode.objects.create(
            city="City",
            country="Country",
            title="Default Active",
            achievement="Achievement",
            x=50.0,
            y=50.0,
            category=MapNodeCategory.STRATEGY,
        )
        self.assertTrue(node.is_active)

    def test_default_lat_lng_blank(self):
        node = MapNode.objects.create(
            city="City",
            country="Country",
            title="No Coords",
            achievement="Achievement",
            x=50.0,
            y=50.0,
            category=MapNodeCategory.ALLIANCE,
        )
        self.assertEqual(node.lat, "")
        self.assertEqual(node.lng, "")

    def test_map_node_ordering_by_title(self):
        node_b = MapNode.objects.create(
            city="B City", country="B", title="Beta",
            achievement="A", x=1, y=1, category=MapNodeCategory.ACADEMIC,
        )
        node_a = MapNode.objects.create(
            city="A City", country="A", title="Alpha",
            achievement="A", x=1, y=1, category=MapNodeCategory.ACADEMIC,
        )
        qs = MapNode.objects.all()
        self.assertEqual(qs[0].id, node_a.id)
        self.assertEqual(qs[1].id, node_b.id)
