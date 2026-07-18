from django.test import TestCase
from rest_framework.exceptions import NotFound, ValidationError

from apps.cms.models import (
    HeroBanner,
    NewsArticle,
    Partner,
    AboutUs,
    FAQ,
    ContactRequest,
    MapNode,
    Gallery,
)
from apps.cms.services.hero_banner_service import (
    create_hero_banner,
    update_hero_banner,
    delete_hero_banner,
    get_hero_banner_or_404,
)
from apps.cms.services.news_service import create_news_article, get_news_article_by_slug_or_404
from apps.cms.services.contact_request_service import (
    create_contact_request,
    list_contact_requests,
    get_contact_request_or_404,
    update_contact_request,
    delete_contact_request,
)
from apps.cms.services.faq_service import create_faq, get_faq_or_404
from apps.cms.services.map_node_service import (
    create_map_node,
    update_map_node,
    delete_map_node,
    get_map_node_or_404,
    list_map_nodes,
    list_active_map_nodes,
)
from apps.cms.services.gallery_service import (
    create_gallery_item,
    update_gallery_item,
    delete_gallery_item,
    get_gallery_or_404,
    list_gallery_items,
    list_active_gallery_items,
)
from apps.cms.constants import ContactStatus, ContactPriority, MapNodeCategory


class HeroBannerServiceTest(TestCase):
    def test_create_banner_with_video(self):
        banner = create_hero_banner({"title": "Banner", "video_url": "https://example.com/vid"})
        self.assertEqual(banner.title, "Banner")

    def test_create_banner_with_image_and_video_raises_error(self):
        with self.assertRaises(ValidationError) as ctx:
            create_hero_banner({
                "title": "Bad",
                "image": "fake.jpg",
                "video_url": "https://example.com/vid",
            })
        self.assertIn("not both", str(ctx.exception).lower())

    def test_create_banner_without_media_raises_error(self):
        with self.assertRaises(ValidationError) as ctx:
            create_hero_banner({"title": "Bad"})
        self.assertIn("must be provided", str(ctx.exception).lower())

    def test_button_requires_url(self):
        with self.assertRaises(ValidationError):
            create_hero_banner({
                "title": "Bad",
                "video_url": "https://example.com/vid",
                "button_text": "Click",
            })

    def test_url_requires_button(self):
        with self.assertRaises(ValidationError):
            create_hero_banner({
                "title": "Bad",
                "video_url": "https://example.com/vid",
                "button_url": "https://example.com",
            })

    def test_get_or_404_raises_not_found(self):
        with self.assertRaises(NotFound):
            get_hero_banner_or_404("00000000-0000-0000-0000-000000000000")

    def test_update_banner(self):
        banner = create_hero_banner({"title": "Old", "video_url": "https://example.com/vid"})
        updated = update_hero_banner(banner, {"title": "New"})
        self.assertEqual(updated.title, "New")

    def test_delete_banner(self):
        banner = create_hero_banner({"title": "Del", "video_url": "https://example.com/vid"})
        delete_hero_banner(banner)
        with self.assertRaises(NotFound):
            get_hero_banner_or_404(banner.id)


class NewsServiceTest(TestCase):
    def test_get_article_by_slug(self):
        article = create_news_article({
            "title": "Test", "slug": "test-slug", "content": "Content",
        })
        found = get_news_article_by_slug_or_404("test-slug")
        self.assertEqual(found.id, article.id)

    def test_get_article_by_slug_not_found(self):
        with self.assertRaises(NotFound):
            get_news_article_by_slug_or_404("non-existent")

    def test_create_with_image_and_video_raises_error(self):
        with self.assertRaises(ValidationError):
            create_news_article({
                "title": "Bad", "slug": "bad", "content": "C",
                "image": "fake.jpg", "video_url": "https://example.com/vid",
            })


class ContactRequestServiceTest(TestCase):
    def test_create_contact_request(self):
        cr = create_contact_request({
            "name": "John", "email": "john@test.com",
            "subject": "Help", "description": "I need help",
        })
        self.assertIsNotNone(cr.id)
        self.assertEqual(cr.name, "John")
        self.assertEqual(cr.email, "john@test.com")
        self.assertEqual(cr.subject, "Help")
        self.assertEqual(cr.description, "I need help")
        self.assertEqual(cr.status, ContactStatus.OPEN)
        self.assertEqual(cr.priority, ContactPriority.MEDIUM)

    def test_create_with_all_fields(self):
        cr = create_contact_request({
            "name": "Jane", "email": "jane@test.com",
            "phone": "+251911234567", "subject": "Urgent",
            "description": "Please help ASAP",
            "status": ContactStatus.OPEN,
            "priority": ContactPriority.URGENT,
        })
        self.assertEqual(cr.phone, "+251911234567")
        self.assertEqual(cr.priority, ContactPriority.URGENT)

    def test_create_without_name_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "email": "john@test.com", "subject": "Help", "description": "Desc",
            })

    def test_create_with_empty_name_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "name": "   ", "email": "john@test.com",
                "subject": "Help", "description": "Desc",
            })

    def test_create_without_email_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "name": "John", "subject": "Help", "description": "Desc",
            })

    def test_create_without_subject_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "name": "John", "email": "john@test.com", "description": "Desc",
            })

    def test_create_with_empty_subject_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "name": "John", "email": "john@test.com",
                "subject": "", "description": "Desc",
            })

    def test_create_without_description_raises_error(self):
        with self.assertRaises(ValidationError):
            create_contact_request({
                "name": "John", "email": "john@test.com", "subject": "Help",
            })

    def test_list_contact_requests(self):
        create_contact_request({
            "name": "A", "email": "a@t.com", "subject": "S1", "description": "D1",
        })
        create_contact_request({
            "name": "B", "email": "b@t.com", "subject": "S2", "description": "D2",
        })
        qs = list_contact_requests()
        self.assertEqual(qs.count(), 2)

    def test_get_or_404_found(self):
        cr = create_contact_request({
            "name": "Find", "email": "find@t.com", "subject": "Find", "description": "D",
        })
        found = get_contact_request_or_404(cr.id)
        self.assertEqual(found.id, cr.id)

    def test_get_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_contact_request_or_404("00000000-0000-0000-0000-000000000000")

    def test_update_status(self):
        cr = create_contact_request({
            "name": "John", "email": "john@t.com", "subject": "S", "description": "D",
        })
        updated = update_contact_request(cr, {"status": ContactStatus.IN_PROGRESS})
        self.assertEqual(updated.status, ContactStatus.IN_PROGRESS)

    def test_update_priority(self):
        cr = create_contact_request({
            "name": "John", "email": "john@t.com", "subject": "S", "description": "D",
        })
        updated = update_contact_request(cr, {"priority": ContactPriority.HIGH})
        self.assertEqual(updated.priority, ContactPriority.HIGH)

    def test_update_multiple_fields(self):
        cr = create_contact_request({
            "name": "John", "email": "john@t.com", "subject": "S", "description": "D",
        })
        updated = update_contact_request(cr, {
            "name": "Jane",
            "email": "jane@t.com",
            "phone": "+251911111111",
        })
        self.assertEqual(updated.name, "Jane")
        self.assertEqual(updated.email, "jane@t.com")
        self.assertEqual(updated.phone, "+251911111111")

    def test_update_invalid_status_raises_error(self):
        cr = create_contact_request({
            "name": "John", "email": "john@t.com", "subject": "S", "description": "D",
        })
        with self.assertRaises(ValidationError):
            update_contact_request(cr, {"status": "INVALID"})

    def test_update_invalid_priority_raises_error(self):
        cr = create_contact_request({
            "name": "John", "email": "john@t.com", "subject": "S", "description": "D",
        })
        with self.assertRaises(ValidationError):
            update_contact_request(cr, {"priority": "INVALID"})

    def test_delete_contact_request(self):
        cr = create_contact_request({
            "name": "Del", "email": "del@t.com", "subject": "Del", "description": "D",
        })
        delete_contact_request(cr)
        with self.assertRaises(NotFound):
            get_contact_request_or_404(cr.id)

    def test_ordering_newest_first(self):
        cr1 = create_contact_request({
            "name": "Old", "email": "o@t.com", "subject": "O", "description": "D",
        })
        cr2 = create_contact_request({
            "name": "New", "email": "n@t.com", "subject": "N", "description": "D",
        })
        qs = list_contact_requests()
        self.assertEqual(qs[0].id, cr2.id)
        self.assertEqual(qs[1].id, cr1.id)


class FAQServiceTest(TestCase):
    def test_create_faq(self):
        faq = create_faq({"question": "Q?", "answer": "A."})
        self.assertEqual(faq.question, "Q?")

    def test_get_or_404_found(self):
        faq = create_faq({"question": "Q?", "answer": "A."})
        found = get_faq_or_404(faq.id)
        self.assertEqual(found.id, faq.id)

    def test_get_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_faq_or_404("00000000-0000-0000-0000-000000000000")


class GalleryServiceTest(TestCase):
    """Service-level tests for Gallery CRUD."""

    def test_create_gallery_item(self):
        item = create_gallery_item({
            "title": "Photo",
            "description": "A nice photo",
            "video_url": "https://example.com/video",
        })
        self.assertIsNotNone(item.id)
        self.assertEqual(item.title, "Photo")
        self.assertEqual(item.description, "A nice photo")
        self.assertEqual(item.video_url, "https://example.com/video")
        self.assertTrue(item.is_active)

    def test_create_gallery_item_minimal(self):
        item = create_gallery_item({
            "title": "Minimal",
            "video_url": "https://example.com/vid",
        })
        self.assertEqual(item.title, "Minimal")
        self.assertEqual(item.description, "")
        self.assertFalse(item.image)

    def test_list_gallery_items_includes_inactive(self):
        create_gallery_item({"title": "Active", "video_url": "https://example.com/vid"})
        create_gallery_item({"title": "Inactive", "is_active": False, "video_url": "https://example.com/vid"})
        qs = list_gallery_items()
        self.assertEqual(qs.count(), 2)

    def test_list_active_gallery_items_excludes_inactive(self):
        create_gallery_item({"title": "Active", "video_url": "https://example.com/vid"})
        create_gallery_item({"title": "Inactive", "is_active": False, "video_url": "https://example.com/vid"})
        qs = list_active_gallery_items()
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs[0].title, "Active")

    def test_get_gallery_or_404_found(self):
        item = create_gallery_item({"title": "Find Me", "video_url": "https://example.com/vid"})
        found = get_gallery_or_404(item.id)
        self.assertEqual(found.id, item.id)

    def test_get_gallery_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_gallery_or_404("00000000-0000-0000-0000-000000000000")

    def test_get_gallery_or_404_active_only_found(self):
        item = create_gallery_item({"title": "Active", "video_url": "https://example.com/vid"})
        found = get_gallery_or_404(item.id, active_only=True)
        self.assertEqual(found.id, item.id)

    def test_get_gallery_or_404_active_only_excludes_inactive(self):
        item = create_gallery_item({"title": "Inactive", "is_active": False, "video_url": "https://example.com/vid"})
        with self.assertRaises(NotFound):
            get_gallery_or_404(item.id, active_only=True)

    def test_update_gallery_item(self):
        item = create_gallery_item({"title": "Old Title", "video_url": "https://example.com/vid"})
        updated = update_gallery_item(item, {"title": "New Title"})
        self.assertEqual(updated.title, "New Title")

    def test_update_gallery_item_multiple_fields(self):
        item = create_gallery_item({"title": "Old", "description": "Old desc", "video_url": "https://example.com/vid"})
        updated = update_gallery_item(item, {
            "title": "New",
            "description": "New desc",
            "video_url": "https://example.com/new",
        })
        self.assertEqual(updated.title, "New")
        self.assertEqual(updated.description, "New desc")
        self.assertEqual(updated.video_url, "https://example.com/new")

    def test_delete_gallery_item_hard_delete(self):
        item = create_gallery_item({"title": "Delete Me", "video_url": "https://example.com/vid"})
        delete_gallery_item(item)
        with self.assertRaises(NotFound):
            get_gallery_or_404(item.id)

    def test_delete_gallery_item_removes_from_db(self):
        item = create_gallery_item({"title": "Gone", "video_url": "https://example.com/vid"})
        item_id = item.id
        delete_gallery_item(item)
        self.assertFalse(Gallery.objects.filter(id=item_id).exists())

    def test_delete_gallery_item_twice_raises_not_found(self):
        item = create_gallery_item({"title": "Double Delete", "video_url": "https://example.com/vid"})
        delete_gallery_item(item)
        with self.assertRaises(NotFound):
            get_gallery_or_404(item.id)

    def test_ordering_newest_first(self):
        old = create_gallery_item({"title": "Older", "video_url": "https://example.com/vid"})
        new = create_gallery_item({"title": "Newer", "video_url": "https://example.com/vid"})
        qs = list_gallery_items()
        self.assertEqual(qs[0].id, new.id)
        self.assertEqual(qs[1].id, old.id)


class MapNodeServiceTest(TestCase):
    """Service-level tests for MapNode CRUD."""

    def _data(self, **overrides):
        defaults = {
            "city": "Addis Ababa",
            "country": "Ethiopia",
            "title": "Test Node",
            "achievement": "Great achievement.",
            "x": 50.0,
            "y": 25.0,
            "category": MapNodeCategory.CHAMPIONSHIP,
        }
        defaults.update(overrides)
        return defaults

    def test_create_map_node(self):
        node = create_map_node(self._data())
        self.assertIsNotNone(node.id)
        self.assertEqual(node.title, "Test Node")
        self.assertEqual(node.category, MapNodeCategory.CHAMPIONSHIP)
        self.assertTrue(node.is_active)

    def test_create_map_node_with_all_fields(self):
        node = create_map_node(self._data(
            lat="8.9806\u00b0 N",
            lng="38.7578\u00b0 E",
        ))
        self.assertEqual(node.lat, "8.9806\u00b0 N")
        self.assertEqual(node.lng, "38.7578\u00b0 E")
        self.assertEqual(node.x, 50.0)
        self.assertEqual(node.y, 25.0)

    def test_create_map_node_each_category(self):
        for category in MapNodeCategory.values:
            node = create_map_node(self._data(
                title=f"Node {category}", category=category,
            ))
            self.assertEqual(node.category, category)

    def test_list_map_nodes_includes_inactive(self):
        create_map_node(self._data(title="Active"))
        create_map_node(self._data(title="Inactive", is_active=False))
        qs = list_map_nodes()
        self.assertEqual(qs.count(), 2)

    def test_list_active_map_nodes_excludes_inactive(self):
        create_map_node(self._data(title="Active"))
        create_map_node(self._data(title="Inactive", is_active=False))
        qs = list_active_map_nodes()
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs[0].title, "Active")

    def test_get_map_node_or_404_found(self):
        node = create_map_node(self._data())
        found = get_map_node_or_404(node.id)
        self.assertEqual(found.id, node.id)

    def test_get_map_node_or_404_not_found(self):
        with self.assertRaises(NotFound):
            get_map_node_or_404("00000000-0000-0000-0000-000000000000")

    def test_update_map_node(self):
        node = create_map_node(self._data())
        updated = update_map_node(node, {"title": "Updated Title"})
        self.assertEqual(updated.title, "Updated Title")

    def test_update_map_node_multiple_fields(self):
        node = create_map_node(self._data())
        updated = update_map_node(node, {
            "city": "Dire Dawa",
            "country": "Ethiopia",
            "achievement": "New achievement.",
        })
        self.assertEqual(updated.city, "Dire Dawa")
        self.assertEqual(updated.country, "Ethiopia")
        self.assertEqual(updated.achievement, "New achievement.")

    def test_update_map_node_category(self):
        node = create_map_node(self._data())
        updated = update_map_node(node, {"category": MapNodeCategory.RESEARCH})
        self.assertEqual(updated.category, MapNodeCategory.RESEARCH)

    def test_delete_map_node_soft_delete(self):
        node = create_map_node(self._data())
        self.assertTrue(node.is_active)
        delete_map_node(node)
        node.refresh_from_db()
        self.assertFalse(node.is_active)

    def test_delete_map_node_still_exists(self):
        node = create_map_node(self._data())
        delete_map_node(node)
        # Should still be retrievable (not hard deleted)
        found = get_map_node_or_404(node.id)
        self.assertEqual(found.id, node.id)
        self.assertFalse(found.is_active)

    def test_ordering_by_title(self):
        node_b = create_map_node(self._data(title="Beta", x=1, y=1))
        node_a = create_map_node(self._data(title="Alpha", x=1, y=1))
        qs = list_map_nodes()
        self.assertEqual(qs[0].id, node_a.id)
        self.assertEqual(qs[1].id, node_b.id)
