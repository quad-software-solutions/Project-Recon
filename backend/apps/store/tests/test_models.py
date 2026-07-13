import uuid

from django.db import IntegrityError
from django.test import TestCase

from apps.store.models import BranchInventory, Product, ProductCategory, ProductImage


class ProductCategoryModelTest(TestCase):
    def test_create_category(self):
        category = ProductCategory.objects.create(name="Electronics", description="Electronic items")
        self.assertEqual(str(category), "Electronics")
        self.assertTrue(category.is_active)
        self.assertIsNotNone(category.id)
        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)

    def test_category_name_unique(self):
        ProductCategory.objects.create(name="Robotics")
        with self.assertRaises(IntegrityError):
            ProductCategory.objects.create(name="Robotics")

    def test_category_defaults(self):
        category = ProductCategory.objects.create(name="Books")
        self.assertIsNone(category.description)
        self.assertTrue(category.is_active)


class ProductModelTest(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(name="Kits")

    def test_create_product(self):
        product = Product.objects.create(
            category=self.category,
            name="Robot Kit",
            slug="robot-kit",
            sku="KIT-001",
            price=99.99,
        )
        self.assertEqual(str(product), "Robot Kit")
        self.assertEqual(product.category, self.category)
        self.assertTrue(product.is_active)
        self.assertIsNone(product.archived_at)
        self.assertIsNotNone(product.id)
        self.assertIsNotNone(product.created_at)

    def test_product_sku_unique(self):
        Product.objects.create(
            category=self.category, name="Kit A", slug="kit-a", sku="SKU-001", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit B",
                slug="kit-b",
                sku="SKU-001",
                price=20,
            )

    def test_product_slug_unique(self):
        Product.objects.create(
            category=self.category, name="Kit A", slug="same-slug", sku="SKU-A", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit B",
                slug="same-slug",
                sku="SKU-B",
                price=20,
            )

    def test_product_name_unique_within_category(self):
        Product.objects.create(
            category=self.category, name="Kit", slug="kit-1", sku="SKU-1", price=10
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Kit",
                slug="kit-2",
                sku="SKU-2",
                price=20,
            )

    def test_same_name_different_category_allowed(self):
        other_category = ProductCategory.objects.create(name="Other")
        Product.objects.create(
            category=self.category, name="Kit", slug="kit-1", sku="SKU-1", price=10
        )
        Product.objects.create(
            category=other_category,
            name="Kit",
            slug="kit-2",
            sku="SKU-2",
            price=20,
        )

    def test_product_price_gt_zero(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                category=self.category,
                name="Free Item",
                slug="free-item",
                sku="FREE",
                price=0,
            )

    def test_category_protect_on_delete(self):
        product = Product.objects.create(
            category=self.category, name="Kit", slug="kit", sku="KIT", price=10
        )
        with self.assertRaises(IntegrityError):
            self.category.delete()
        self.assertTrue(Product.objects.filter(pk=product.pk).exists())


class ProductImageModelTest(TestCase):
    def setUp(self):
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Product", slug="product", sku="PRD", price=10
        )

    def test_create_image(self):
        image = ProductImage.objects.create(
            product=self.product,
            image="store/products/test.jpg",
            alt_text="Test image",
            is_primary=True,
            display_order=0,
        )
        self.assertEqual(image.product, self.product)
        self.assertTrue(image.is_primary)
        self.assertIsNotNone(image.id)
        self.assertIsNotNone(image.created_at)

    def test_only_one_primary_per_product(self):
        ProductImage.objects.create(
            product=self.product,
            image="store/products/primary.jpg",
            is_primary=True,
            display_order=0,
        )
        second = ProductImage.objects.create(
            product=self.product,
            image="store/products/secondary.jpg",
            is_primary=True,
            display_order=1,
        )
        primary_count = ProductImage.objects.filter(
            product=self.product, is_primary=True
        ).count()
        self.assertEqual(primary_count, 1)
        self.assertTrue(
            ProductImage.objects.get(pk=second.pk).is_primary
        )

    def test_unique_display_order_per_product(self):
        ProductImage.objects.create(
            product=self.product,
            image="store/products/a.jpg",
            display_order=0,
        )
        with self.assertRaises(IntegrityError):
            ProductImage.objects.create(
                product=self.product,
                image="store/products/b.jpg",
                display_order=0,
            )


class BranchInventoryModelTest(TestCase):
    def setUp(self):
        category = ProductCategory.objects.create(name="Category")
        self.product = Product.objects.create(
            category=category, name="Product", slug="product", sku="PRD", price=10
        )
        from apps.accounts.models import Branch
        self.branch = Branch.objects.create(name="Test Branch", code="TB01")

    def test_create_inventory(self):
        inv = BranchInventory.objects.create(
            branch=self.branch, product=self.product, quantity=10
        )
        self.assertEqual(inv.quantity, 10)
        self.assertIsNone(inv.minimum_quantity)
        self.assertIsNotNone(inv.id)
        self.assertIsNotNone(inv.created_at)
        self.assertIsNotNone(inv.updated_at)

    def test_unique_branch_product(self):
        BranchInventory.objects.create(
            branch=self.branch, product=self.product, quantity=5
        )
        with self.assertRaises(IntegrityError):
            BranchInventory.objects.create(
                branch=self.branch, product=self.product, quantity=3
            )

    def test_quantity_gte_zero(self):
        with self.assertRaises(IntegrityError):
            BranchInventory.objects.create(
                branch=self.branch, product=self.product, quantity=-1
            )
