from django.test import TestCase
from rest_framework.exceptions import NotFound, ValidationError

from apps.store.models import Product, ProductCategory, ProductImage
from apps.store.services.category_service import (
    activate_category,
    create_category,
    deactivate_category,
    get_category_or_404,
    list_active_categories,
    list_categories,
    update_category,
)
from apps.store.services.product_service import (
    activate_product,
    archive_product,
    create_product,
    deactivate_product,
    get_product_or_404,
    list_active_products,
    list_products,
    restore_product,
    update_product,
)
from apps.store.services.product_image_service import (
    delete_image,
    get_image_or_404,
    list_product_images,
    reorder_images,
    set_primary_image,
    upload_image,
)


class CategoryServiceTest(TestCase):
    def test_create_category(self):
        category = create_category({"name": "Electronics", "description": "Devices"})
        self.assertEqual(category.name, "Electronics")
        self.assertTrue(category.is_active)

    def test_create_duplicate_name_raises_error(self):
        create_category({"name": "Robotics"})
        with self.assertRaises(ValidationError):
            create_category({"name": "Robotics"})

    def test_create_duplicate_case_insensitive(self):
        create_category({"name": "Robotics"})
        with self.assertRaises(ValidationError):
            create_category({"name": "robotics"})

    def test_get_or_404_raises_not_found(self):
        with self.assertRaises(NotFound):
            get_category_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_categories(self):
        create_category({"name": "A"})
        create_category({"name": "B"})
        self.assertEqual(list_categories().count(), 2)

    def test_list_active_categories(self):
        cat_a = create_category({"name": "Active A"})
        cat_b = create_category({"name": "Active B"})
        deactivate_category(cat_b)
        active = list_active_categories()
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().name, "Active A")

    def test_update_category(self):
        category = create_category({"name": "Old Name"})
        updated = update_category(category, {"name": "New Name"})
        self.assertEqual(updated.name, "New Name")

    def test_activate_deactivate(self):
        category = create_category({"name": "Toggle"})
        self.assertTrue(category.is_active)
        deactivate_category(category)
        self.assertFalse(
            ProductCategory.objects.get(pk=category.pk).is_active
        )
        activate_category(category)
        self.assertTrue(
            ProductCategory.objects.get(pk=category.pk).is_active
        )


class ProductServiceTest(TestCase):
    def setUp(self):
        self.category = create_category({"name": "Kits"})

    def test_create_product(self):
        product = create_product({
            "category": self.category.pk,
            "name": "Robot Kit",
            "slug": "robot-kit",
            "sku": "KIT-001",
            "price": 99.99,
        })
        self.assertEqual(product.name, "Robot Kit")
        self.assertTrue(product.is_active)
        self.assertIsNone(product.archived_at)

    def test_create_product_inactive_category_raises_error(self):
        deactivate_category(self.category)
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Bad",
                "slug": "bad",
                "sku": "BAD",
                "price": 10,
            })

    def test_create_duplicate_sku_raises_error(self):
        create_product({
            "category": self.category.pk,
            "name": "Kit A",
            "slug": "kit-a",
            "sku": "SAME",
            "price": 10,
        })
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Kit B",
                "slug": "kit-b",
                "sku": "SAME",
                "price": 20,
            })

    def test_create_duplicate_slug_raises_error(self):
        create_product({
            "category": self.category.pk,
            "name": "Kit A",
            "slug": "same-slug",
            "sku": "SKU-A",
            "price": 10,
        })
        with self.assertRaises(ValidationError):
            create_product({
                "category": self.category.pk,
                "name": "Kit B",
                "slug": "same-slug",
                "sku": "SKU-B",
                "price": 20,
            })

    def test_get_or_404_raises_not_found(self):
        with self.assertRaises(NotFound):
            get_product_or_404("00000000-0000-0000-0000-000000000000")

    def test_list_products(self):
        create_product({
            "category": self.category.pk, "name": "A", "slug": "a", "sku": "A", "price": 10,
        })
        create_product({
            "category": self.category.pk, "name": "B", "slug": "b", "sku": "B", "price": 20,
        })
        self.assertEqual(list_products().count(), 2)

    def test_list_active_excludes_archived_and_inactive(self):
        p1 = create_product({
            "category": self.category.pk, "name": "Active", "slug": "active", "sku": "ACT", "price": 10,
        })
        p2 = create_product({
            "category": self.category.pk, "name": "Archived", "slug": "archived", "sku": "ARC", "price": 20,
        })
        archive_product(p2)
        deactivate_product(p1)
        self.assertEqual(list_active_products().count(), 0)
        p3 = create_product({
            "category": self.category.pk, "name": "Available", "slug": "avail", "sku": "AVL", "price": 30,
        })
        self.assertEqual(list_active_products().count(), 1)

    def test_update_product(self):
        product = create_product({
            "category": self.category.pk, "name": "Old", "slug": "old", "sku": "OLD", "price": 10,
        })
        updated = update_product(product, {"name": "New", "price": 15})
        self.assertEqual(updated.name, "New")
        self.assertEqual(updated.price, 15)

    def test_archive_and_restore(self):
        product = create_product({
            "category": self.category.pk, "name": "Temp", "slug": "temp", "sku": "TMP", "price": 10,
        })
        archive_product(product)
        product.refresh_from_db()
        self.assertIsNotNone(product.archived_at)
        self.assertFalse(product.is_active)
        restore_product(product)
        product.refresh_from_db()
        self.assertIsNone(product.archived_at)
        self.assertTrue(product.is_active)

    def test_activate_archived_raises_error(self):
        product = create_product({
            "category": self.category.pk, "name": "Arch", "slug": "arch", "sku": "ARC", "price": 10,
        })
        archive_product(product)
        with self.assertRaises(ValidationError):
            activate_product(product)


class ProductImageServiceTest(TestCase):
    def setUp(self):
        category = create_category({"name": "Category"})
        self.product = create_product({
            "category": category.pk, "name": "Product", "slug": "product", "sku": "PRD", "price": 10,
        })

    def test_upload_image(self):
        img = upload_image(self.product, "store/products/test.jpg", alt_text="Test")
        self.assertEqual(img.product, self.product)
        self.assertEqual(img.display_order, 0)

    def test_upload_multiple_images_increments_order(self):
        img1 = upload_image(self.product, "store/products/a.jpg")
        img2 = upload_image(self.product, "store/products/b.jpg")
        self.assertEqual(img1.display_order, 0)
        self.assertEqual(img2.display_order, 1)

    def test_set_primary_demotes_previous(self):
        img1 = upload_image(self.product, "store/products/a.jpg", is_primary=True)
        img2 = upload_image(self.product, "store/products/b.jpg", is_primary=True)
        img1.refresh_from_db()
        self.assertFalse(img1.is_primary)
        self.assertTrue(
            ProductImage.objects.get(pk=img2.pk).is_primary
        )

    def test_delete_primary_promotes_next(self):
        img1 = upload_image(self.product, "store/products/a.jpg", is_primary=True)
        img2 = upload_image(self.product, "store/products/b.jpg")
        delete_image(img1)
        img2.refresh_from_db()
        self.assertTrue(img2.is_primary)

    def test_get_image_or_404(self):
        img = upload_image(self.product, "store/products/test.jpg")
        fetched = get_image_or_404(img.pk)
        self.assertEqual(fetched.pk, img.pk)

    def test_reorder_images(self):
        img1 = upload_image(self.product, "store/products/a.jpg")
        img2 = upload_image(self.product, "store/products/b.jpg")
        img3 = upload_image(self.product, "store/products/c.jpg")
        images = reorder_images(self.product, [img3.pk, img1.pk, img2.pk])
        self.assertEqual(images[0].pk, img3.pk)
        self.assertEqual(images[1].pk, img1.pk)
        self.assertEqual(images[2].pk, img2.pk)

    def test_list_product_images(self):
        upload_image(self.product, "store/products/a.jpg")
        upload_image(self.product, "store/products/b.jpg")
        self.assertEqual(list_product_images(self.product).count(), 2)
