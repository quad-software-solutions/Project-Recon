import uuid
import tempfile

from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.throttling import SimpleRateThrottle
from PIL import Image

from apps.accounts.models import Branch
from apps.accounts.services import user_service
from apps.cms.models import (
    HeroBanner,
    NewsArticle,
    Partner,
    AboutUs,
    FAQ,
    MapNode,
)
from apps.cms.services.hero_banner_service import create_hero_banner
from apps.cms.services.news_service import create_news_article
from apps.cms.services.partner_service import create_partner
from apps.cms.services.about_service import create_about_us
from apps.cms.services.faq_service import create_faq
from apps.cms.services.contact_request_service import create_contact_request
from apps.cms.services.map_node_service import create_map_node
from apps.cms.services.gallery_service import create_gallery_item
from apps.cms.constants import MapNodeCategory


@override_settings(AUTH_REQUIRE_DEVICE_VERIFICATION=False)
class CMSApiTestCase(APITestCase):
    """Base test case with users of all roles and CMS fixtures."""

    base_url = "/api/v1/cms"

    def setUp(self):
        self.password = "StrongP@ssw0rd!2026"

        self.super_admin = user_service.create_super_admin(
            "admin@test.com", "Super", "Admin", self.password
        )
        self.branch = Branch.objects.create(name="Main Branch", code="MB01")
        self.branch_manager = user_service.create_branch_manager(
            "manager@test.com", "Manager", "User", self.password, self.branch
        )
        user_service.activate_user(self.branch_manager)
        self.student = user_service.create_student_user(
            "student@test.com", "Student", "User", self.password, self.branch
        )
        user_service.activate_user(self.student)

        self.banner = create_hero_banner({
            "title": "Hero Banner",
            "video_url": "https://example.com/vid",
        })
        self.article = create_news_article({
            "title": "News Article",
            "slug": "news-article",
            "content": "Content here",
        })
        self.partner = create_partner({"title": "Partner Org"})
        self.about = create_about_us({
            "title": "About Us",
            "slug": "about-us",
            "description": "About description",
        })
        self.faq = create_faq({"question": "What is this?", "answer": "This is a FAQ."})
        self.inactive_banner = create_hero_banner({
            "title": "Inactive Banner",
            "video_url": "https://example.com/inactive",
            "is_active": False,
        })
        self.contact_request = create_contact_request({
            "name": "John",
            "email": "john@test.com",
            "subject": "Help needed",
            "description": "Please assist.",
        })
        self.map_node = create_map_node({
            "city": "Addis Ababa",
            "country": "Ethiopia",
            "title": "Test Map Node",
            "achievement": "A great achievement.",
            "x": 50.0,
            "y": 30.0,
            "category": MapNodeCategory.CHAMPIONSHIP,
        })
        self.inactive_map_node = create_map_node({
            "city": "Dire Dawa",
            "country": "Ethiopia",
            "title": "Inactive Map Node",
            "achievement": "Inactive.",
            "x": 20.0,
            "y": 40.0,
            "category": MapNodeCategory.ACADEMIC,
            "is_active": False,
        })
        self.gallery_item = create_gallery_item({
            "title": "Gallery Photo",
            "description": "A nice photo",
            "video_url": "https://example.com/gallery-video",
        })
        self.inactive_gallery = create_gallery_item({
            "title": "Inactive Gallery",
            "description": "Hidden",
            "is_active": False,
        })
        # DRF caches SimpleRateThrottle.THROTTLE_RATES at import time,
        # so override_settings(REST_FRAMEWORK=...) has no effect on it.
        self._old_throttle_rates = SimpleRateThrottle.THROTTLE_RATES
        SimpleRateThrottle.THROTTLE_RATES = {**SimpleRateThrottle.THROTTLE_RATES,
            "anon_login": "1000/min",
            "anon_forgot_password": "1000/min",
            "anon_reset_password": "1000/min",
            "user_otp_request": "1000/min",
            "user_otp_verify": "1000/min",
        }

    def tearDown(self):
        SimpleRateThrottle.THROTTLE_RATES = self._old_throttle_rates
        super().tearDown()

    def _login(self, email=None, password=None):
        data = {"email": email or self.student.email, "password": password or self.password}
        return self.client.post(
            f"{self.base_url.replace('cms', 'accounts')}/login/",
            data,
            format="json",
        )

    def authenticate_as(self, user=None):
        email = user.email if user else self.super_admin.email
        response = self._login(email=email, password=self.password)
        token = response.json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


class PublicEndpointTest(CMSApiTestCase):
    """Public endpoints must be accessible without authentication."""

    def test_list_hero_banners(self):
        response = self.client.get(f"{self.base_url}/hero-banners/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        titles = [b["title"] for b in data["results"]]
        self.assertIn("Hero Banner", titles)
        self.assertNotIn("Inactive Banner", titles)

    def test_list_news(self):
        response = self.client.get(f"{self.base_url}/news/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_news_by_slug(self):
        response = self.client.get(f"{self.base_url}/news/{self.article.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["slug"], "news-article")

    def test_retrieve_news_by_slug_not_found(self):
        response = self.client.get(f"{self.base_url}/news/non-existent/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_partners(self):
        response = self.client.get(f"{self.base_url}/partners/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_about(self):
        response = self.client.get(f"{self.base_url}/about/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if data["results"]:
            item = data["results"][0]
            self.assertIn("image", item)
            self.assertIn("mission", item)
            self.assertIn("vision", item)

    def test_retrieve_about_by_slug(self):
        response = self.client.get(f"{self.base_url}/about/{self.about.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["slug"], "about-us")
        self.assertIn("image", data)
        self.assertIn("mission", data)
        self.assertIn("vision", data)

    def test_list_faqs(self):
        response = self.client.get(f"{self.base_url}/faqs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_contact_request(self):
        response = self.client.post(
            f"{self.base_url}/contact-requests/",
            {
                "name": "Jane",
                "email": "jane@test.com",
                "subject": "Issue",
                "description": "Help!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("ticket_number", data)
        self.assertTrue(data["ticket_number"].startswith("CR-"))
        self.assertEqual(data["name"], "Jane")
        self.assertEqual(data["email"], "jane@test.com")
        self.assertEqual(data["subject"], "Issue")
        self.assertEqual(data["description"], "Help!")
        self.assertNotIn("status", data)
        self.assertNotIn("priority", data)
        self.assertIsNone(data.get("phone"))

    def test_create_contact_request_with_phone(self):
        response = self.client.post(
            f"{self.base_url}/contact-requests/",
            {
                "name": "Jane",
                "email": "jane@test.com",
                "subject": "Issue",
                "description": "Help!",
                "phone": "+251911234567",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["phone"], "+251911234567")

    def test_create_contact_request_validation_error(self):
        response = self.client.post(
            f"{self.base_url}/contact-requests/",
            {"subject": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_contact_request_empty_body(self):
        response = self.client.post(
            f"{self.base_url}/contact-requests/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_map_nodes_public(self):
        response = self.client.get(f"{self.base_url}/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        titles = [n["title"] for n in data["results"]]
        self.assertIn("Test Map Node", titles)
        self.assertNotIn("Inactive Map Node", titles)

    def test_list_gallery_public(self):
        response = self.client.get(f"{self.base_url}/gallery/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        titles = [g["title"] for g in data["results"]]
        self.assertIn("Gallery Photo", titles)
        self.assertNotIn("Inactive Gallery", titles)

    def test_retrieve_gallery_detail_public(self):
        response = self.client.get(f"{self.base_url}/gallery/{self.gallery_item.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Gallery Photo")
        self.assertEqual(response.json()["description"], "A nice photo")

    def test_retrieve_gallery_detail_inactive_public(self):
        response = self.client.get(f"{self.base_url}/gallery/{self.inactive_gallery.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_gallery_detail_not_found_public(self):
        response = self.client.get(f"{self.base_url}/gallery/{uuid.uuid4()}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_map_nodes_public_returns_all_fields(self):
        response = self.client.get(f"{self.base_url}/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for node in response.json()["results"]:
            self.assertIn("id", node)
            self.assertIn("city", node)
            self.assertIn("country", node)
            self.assertIn("title", node)
            self.assertIn("achievement", node)
            self.assertIn("x", node)
            self.assertIn("y", node)
            self.assertIn("category", node)


class AdminSuperAdminTest(CMSApiTestCase):
    """Super Admin has full CRUD on all admin endpoints."""

    def setUp(self):
        super().setUp()
        self.authenticate_as(self.super_admin)

    def test_list_hero_banners_admin(self):
        response = self.client.get(f"{self.base_url}/admin/hero-banners/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [b["title"] for b in response.json()["results"]]
        self.assertIn("Inactive Banner", titles)

    def test_create_hero_banner_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/hero-banners/",
            {"title": "New Banner", "video_url": "https://example.com/new"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["title"], "New Banner")

    def test_update_hero_banner_admin(self):
        response = self.client.patch(
            f"{self.base_url}/admin/hero-banners/{self.banner.id}/",
            {"title": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Updated")

    def test_delete_hero_banner_admin(self):
        response = self.client.delete(
            f"{self.base_url}/admin/hero-banners/{self.banner.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_news_admin(self):
        response = self.client.get(f"{self.base_url}/admin/news/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_news_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/news/",
            {"title": "New Article", "slug": "new-article", "content": "Content"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_partners_admin(self):
        response = self.client.get(f"{self.base_url}/admin/partners/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_partner_admin(self):
        temp_image = tempfile.NamedTemporaryFile(suffix=".png")
        image = Image.new("RGB", (100, 100))
        image.save(temp_image, format="PNG")
        temp_image.seek(0)
        response = self.client.post(
            f"{self.base_url}/admin/partners/",
            {"title": "New Partner", "image": temp_image},
            format="multipart",
        )
        temp_image.close()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_about_admin(self):
        response = self.client.get(f"{self.base_url}/admin/about/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_about_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/about/",
            {
                "title": "New Section",
                "slug": "new-section",
                "description": "Desc",
                "mission": "Our mission",
                "vision": "Our vision",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["mission"], "Our mission")
        self.assertEqual(data["vision"], "Our vision")

    def test_create_about_admin_with_image(self):
        temp_image = tempfile.NamedTemporaryFile(suffix=".png")
        image = Image.new("RGB", (100, 100))
        image.save(temp_image, format="PNG")
        temp_image.seek(0)
        response = self.client.post(
            f"{self.base_url}/admin/about/",
            {
                "title": "Image About",
                "slug": "image-about",
                "description": "Desc",
                "mission": "M",
                "vision": "V",
                "image": temp_image,
            },
            format="multipart",
        )
        temp_image.close()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["title"], "Image About")

    def test_list_faqs_admin(self):
        response = self.client.get(f"{self.base_url}/admin/faqs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_faq_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/faqs/",
            {"question": "New Q?", "answer": "New A."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_news_admin(self):
        response = self.client.delete(
            f"{self.base_url}/admin/news/{self.article.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_contact_requests_admin(self):
        response = self.client.get(f"{self.base_url}/admin/contact-requests/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreaterEqual(len(data["results"]), 1)

    def test_retrieve_contact_request_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["ticket_number"], self.contact_request.ticket_number)

    def test_update_contact_request_admin(self):
        response = self.client.patch(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/",
            {"status": "IN_PROGRESS", "priority": "HIGH"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "IN_PROGRESS")
        self.assertEqual(response.json()["priority"], "HIGH")

    def test_delete_contact_request_admin(self):
        response = self.client.delete(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_retrieve_contact_request_not_found_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/contact-requests/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_contact_request_invalid_status(self):
        response = self.client.patch(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/",
            {"status": "INVALID"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contact_request_invalid_priority(self):
        response = self.client.patch(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/",
            {"priority": "INVALID"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Map Node admin tests -------------------------------------------------

    def test_list_map_nodes_admin(self):
        response = self.client.get(f"{self.base_url}/admin/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        titles = [n["title"] for n in data["results"]]
        self.assertIn("Test Map Node", titles)
        self.assertIn("Inactive Map Node", titles)

    def test_create_map_node_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/map-nodes/",
            {
                "city": "Hawassa",
                "country": "Ethiopia",
                "title": "New Map Node",
                "achievement": "New achievement.",
                "x": 75.0,
                "y": 60.0,
                "category": MapNodeCategory.RESEARCH,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["title"], "New Map Node")
        self.assertEqual(data["city"], "Hawassa")
        self.assertEqual(data["category"], MapNodeCategory.RESEARCH)
        self.assertTrue(data["is_active"])

    def test_retrieve_map_node_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Test Map Node")

    def test_retrieve_map_node_not_found_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/map-nodes/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_map_node_admin(self):
        response = self.client.patch(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/",
            {"title": "Updated Map Node", "x": 90.0},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Updated Map Node")
        self.assertEqual(response.json()["x"], 90.0)

    def test_update_map_node_category_admin(self):
        response = self.client.patch(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/",
            {"category": MapNodeCategory.ALLIANCE},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["category"], MapNodeCategory.ALLIANCE)

    def test_delete_map_node_soft_delete_admin(self):
        response = self.client.delete(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Verify soft delete - node should still exist but be inactive
        self.map_node.refresh_from_db()
        self.assertFalse(self.map_node.is_active)

    def test_list_gallery_admin(self):
        response = self.client.get(f"{self.base_url}/admin/gallery/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        titles = [g["title"] for g in data["results"]]
        self.assertIn("Gallery Photo", titles)
        self.assertIn("Inactive Gallery", titles)

    def test_create_gallery_admin(self):
        response = self.client.post(
            f"{self.base_url}/admin/gallery/",
            {
                "title": "New Gallery Item",
                "description": "Brand new",
                "video_url": "https://example.com/new",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["title"], "New Gallery Item")
        self.assertEqual(data["description"], "Brand new")
        self.assertTrue(data["is_active"])

    def test_create_gallery_admin_minimal(self):
        response = self.client.post(
            f"{self.base_url}/admin/gallery/",
            {"title": "Minimal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["title"], "Minimal")

    def test_retrieve_gallery_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Gallery Photo")

    def test_retrieve_gallery_not_found_admin(self):
        response = self.client.get(
            f"{self.base_url}/admin/gallery/{uuid.uuid4()}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_gallery_admin(self):
        response = self.client.patch(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/",
            {"title": "Updated Gallery Photo"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Updated Gallery Photo")

    def test_update_gallery_admin_multiple_fields(self):
        response = self.client.patch(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/",
            {
                "title": "Fully Updated",
                "description": "New description",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "Fully Updated")
        self.assertEqual(response.json()["description"], "New description")

    def test_delete_gallery_admin_hard_delete(self):
        response = self.client.delete(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Verify hard delete — item should be gone from DB
        response = self.client.get(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_gallery_admin_with_image(self):
        temp_image = tempfile.NamedTemporaryFile(suffix=".png")
        image = Image.new("RGB", (100, 100))
        image.save(temp_image, format="PNG")
        temp_image.seek(0)
        response = self.client.post(
            f"{self.base_url}/admin/gallery/",
            {"title": "Image Gallery", "image": temp_image},
            format="multipart",
        )
        temp_image.close()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["title"], "Image Gallery")

    def test_delete_map_node_then_list_excludes_it_from_public(self):
        self.client.delete(f"{self.base_url}/admin/map-nodes/{self.map_node.id}/")
        response = self.client.get(f"{self.base_url}/map-nodes/")
        titles = [n["title"] for n in response.json()["results"]]
        self.assertNotIn("Test Map Node", titles)


class AdminUnauthorizedTest(CMSApiTestCase):
    """Non-admin users must be denied access to admin endpoints."""

    def test_unauthenticated_cannot_access_admin(self):
        response = self.client.get(f"{self.base_url}/admin/hero-banners/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_branch_manager_cannot_access_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.get(f"{self.base_url}/admin/hero-banners/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_admin(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/admin/news/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_create(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/hero-banners/",
            {"title": "Bad", "video_url": "https://example.com/bad"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_delete(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.delete(
            f"{self.base_url}/admin/hero-banners/{self.banner.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_update(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.patch(
            f"{self.base_url}/admin/hero-banners/{self.banner.id}/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_list_contact_requests(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.get(f"{self.base_url}/admin/contact-requests/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_update_contact_request(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.patch(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/",
            {"status": "IN_PROGRESS"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_delete_contact_request(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.delete(
            f"{self.base_url}/admin/contact-requests/{self.contact_request.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_contact_requests_admin(self):
        response = self.client.get(f"{self.base_url}/admin/contact-requests/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_list_map_nodes_admin(self):
        response = self.client.get(f"{self.base_url}/admin/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_branch_manager_cannot_list_map_nodes_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.get(f"{self.base_url}/admin/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_list_map_nodes_admin(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/admin/map-nodes/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_create_map_node(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/map-nodes/",
            {
                "city": "Bad",
                "country": "Bad",
                "title": "Bad",
                "achievement": "Bad",
                "x": 1, "y": 1,
                "category": MapNodeCategory.CHAMPIONSHIP,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_update_map_node(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.patch(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_delete_map_node(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.delete(
            f"{self.base_url}/admin/map-nodes/{self.map_node.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Gallery unauthorized tests ------------------------------------------------

    def test_unauthenticated_cannot_list_gallery_admin(self):
        response = self.client.get(f"{self.base_url}/admin/gallery/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_branch_manager_cannot_list_gallery_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.get(f"{self.base_url}/admin/gallery/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_list_gallery_admin(self):
        self.authenticate_as(self.student)
        response = self.client.get(f"{self.base_url}/admin/gallery/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_create_gallery_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.post(
            f"{self.base_url}/admin/gallery/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_update_gallery_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.patch(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/",
            {"title": "Hack"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_manager_cannot_delete_gallery_admin(self):
        self.authenticate_as(self.branch_manager)
        response = self.client.delete(
            f"{self.base_url}/admin/gallery/{self.gallery_item.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ContactRequestFileUploadTest(CMSApiTestCase):
    """File upload validation for ContactRequest attachments."""

    def _post_with_attachment(self, filename, content=b"test content", authenticated=False):
        from django.core.files.uploadedfile import SimpleUploadedFile
        attachment = SimpleUploadedFile(filename, content)
        data = {
            "name": "Tester",
            "email": "tester@test.com",
            "subject": "File test",
            "description": "Testing file upload",
            "attachment": attachment,
        }
        if authenticated:
            self.authenticate_as(self.super_admin)
            return self.client.post(
                f"{self.base_url}/admin/contact-requests/", data, format="multipart"
            )
        return self.client.post(
            f"{self.base_url}/contact-requests/", data, format="multipart"
        )

    def test_reject_exe_file(self):
        response = self._post_with_attachment("virus.exe")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_sh_file(self):
        response = self._post_with_attachment("script.sh")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_bat_file(self):
        response = self._post_with_attachment("malware.bat")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_js_file(self):
        response = self._post_with_attachment("evil.js")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_pdf_file(self):
        response = self._post_with_attachment("document.pdf", b"%PDF-1.4 test pdf content")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_accept_jpg_file(self):
        from io import BytesIO
        from PIL import Image
        buf = BytesIO()
        Image.new("RGB", (1, 1), color="red").save(buf, format="JPEG")
        response = self._post_with_attachment("photo.jpg", buf.getvalue())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_accept_png_file(self):
        from io import BytesIO
        from PIL import Image
        buf = BytesIO()
        Image.new("RGB", (1, 1), color="red").save(buf, format="PNG")
        response = self._post_with_attachment("image.png", buf.getvalue())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_reject_file_too_large(self):
        large_content = b"x" * (11 * 1024 * 1024)
        response = self._post_with_attachment("large.pdf", large_content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_file_without_extension(self):
        response = self._post_with_attachment("README")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_executable_no_extension(self):
        response = self._post_with_attachment("malware")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_attachment_from_admin_endpoint(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.authenticate_as(self.super_admin)
        attachment = SimpleUploadedFile("hack.exe", b"bad")
        response = self.client.post(
            f"{self.base_url}/admin/contact-requests/",
            {
                "name": "Admin",
                "email": "admin@test.com",
                "subject": "Bad file",
                "description": "Testing",
                "attachment": attachment,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_valid_attachment_from_admin_endpoint(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.authenticate_as(self.super_admin)
        attachment = SimpleUploadedFile("report.pdf", b"%PDF-1.4 valid pdf")
        response = self.client.post(
            f"{self.base_url}/admin/contact-requests/",
            {
                "name": "Admin",
                "email": "admin@test.com",
                "subject": "Good file",
                "description": "Testing",
                "attachment": attachment,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
