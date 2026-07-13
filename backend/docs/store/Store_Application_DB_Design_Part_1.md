# Project Recon

# Store Application

# 🔒 Database Design – Part 1

**Status:** 🔒 LOCKED

**Application:** `store`

---

# Overview

This document defines the core database structure for the Store application.

Part 1 focuses on:

- Product Categories
- Products
- Product Images
- Branch Inventory

Order management, shopping cart, checkout, payments, and inventory transactions are covered in Part 2.

---

# Design Principles

- Products exist globally.
- Prices are global.
- Inventory belongs to branches.
- Images belong to products.
- Categories organize products.
- Products are archived instead of permanently deleted.
- Historical orders must never lose product references.

---

# Entity Relationship Overview

```text
Category
    │
    ▼
 Product
    │
    ├────────────┐
    ▼            ▼
ProductImage   BranchInventory
```

---

# ProductCategory

Represents a logical grouping of products.

Examples

- Robotics Kits
- Electronics
- Sensors
- Motors
- Competition Parts
- Books
- Apparel
- Accessories

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| name | String(100) | ✅ | Category name |
| description | Text | ❌ | Optional description |
| is_active | Boolean | ✅ | Visible for use |
| created_at | DateTime | ✅ | Creation timestamp |
| updated_at | DateTime | ✅ | Last update |

---

## Constraints

- Category names must be unique.
- Categories cannot be deleted while products reference them.
- Inactive categories cannot receive new products.
- Existing products remain valid after category deactivation.

---

## Ownership

Owned by:

Store Application

---

# Product

Represents a physical item sold by the organization.

Examples

- VEX IQ Starter Kit
- Smart Motor
- Battery Pack
- Robotics T-Shirt
- Programming Book

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| category | FK → ProductCategory | ✅ | Product category |
| name | String(200) | ✅ | Product name |
| slug | String | ✅ | URL-friendly identifier |
| short_description | Text | ❌ | Short description |
| description | Text | ❌ | Full description |
| sku | String | ✅ | Internal stock keeping unit |
| barcode | String | ❌ | Optional barcode |
| price | Decimal | ✅ | Global selling price |
| weight | Decimal | ❌ | Shipping information |
| is_active | Boolean | ✅ | Available for sale |
| archived_at | DateTime | ❌ | Product archive timestamp |
| created_at | DateTime | ✅ | Creation timestamp |
| updated_at | DateTime | ✅ | Last update |

---

## Business Rules

- Products are global.
- Products have one global price.
- Products never own inventory.
- Products belong to exactly one category.
- Products may have multiple images.
- Products may exist in multiple branches.
- Archived products remain visible in historical orders.
- Archived products cannot be purchased.

---

## Constraints

- Product name must be unique within its category.
- SKU must be globally unique.
- Slug must be globally unique.
- Price must be greater than zero.
- Archived products cannot be activated automatically.

---

## Deletion Policy

Products are **never permanently deleted** once referenced by an order.

Instead:

```text
Active
      │
      ▼
Archived
```

Archived products:

- remain in historical orders
- cannot be purchased
- cannot appear in search
- cannot appear in product listings

---

## Ownership

Owned by:

Store Application

Referenced by:

- Product Images
- Branch Inventory
- Order Items

---

# ProductImage

Stores images belonging to a Product.

A Product may have multiple images.

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| product | FK → Product | ✅ | Parent product |
| image | Image | ✅ | Uploaded image |
| alt_text | String | ❌ | Accessibility text |
| is_primary | Boolean | ✅ | Primary display image |
| display_order | Integer | ✅ | Display sequence |
| created_at | DateTime | ✅ | Creation timestamp |

---

## Business Rules

- Products may have multiple images.
- Only one image may be marked as primary.
- Images are displayed by display order.
- Primary image is used throughout listings.

---

## Constraints

- One primary image per product.
- Display order must be unique within the product.

---

## Ownership

Owned by:

Product

---

# BranchInventory

Represents inventory for a Product within a specific Branch.

Inventory belongs to branches—not products.

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| branch | FK → Branch | ✅ | Inventory owner |
| product | FK → Product | ✅ | Stored product |
| quantity | Integer | ✅ | Current stock quantity |
| minimum_quantity | Integer | ❌ | Low-stock threshold |
| created_at | DateTime | ✅ | Creation timestamp |
| updated_at | DateTime | ✅ | Last inventory update |

---

## Business Rules

- Inventory is branch-specific.
- Products may exist in multiple branches.
- Every branch manages its own stock independently.
- Inventory cannot become negative.
- Customers may view inventory across all branches.
- Inventory is reduced only after successful payment verification.

---

## Constraints

Unique

```text
(branch, product)
```

Only one inventory record may exist for the same product within a branch.

---

## Ownership

Owned by:

Branch

Referenced by:

- Checkout validation
- Order fulfillment
- Inventory updates

---

# Relationships

```text
ProductCategory
        │
        ▼
     Product
     │      │
     │      └──────────────┐
     ▼                     ▼
ProductImage        BranchInventory
```

---

# Database Integrity Rules

## ProductCategory

- Cannot be deleted while products exist.
- May be deactivated.

---

## Product

- Must belong to one category.
- Cannot own inventory.
- Cannot be permanently deleted after sales.
- Uses archival instead of deletion.

---

## ProductImage

- Must belong to one product.
- One primary image only.

---

## BranchInventory

- One inventory record per product per branch.
- Quantity cannot be negative.
- Inventory belongs to branches.

---

# Index Recommendations

## Product

- slug
- sku
- category
- is_active

---

## ProductCategory

- name
- is_active

---

## ProductImage

- product
- display_order

---

## BranchInventory

- branch
- product
- quantity

Composite Index

```text
(branch, product)
```

---

# Part 1 Summary

This document defines:

- ✅ Product Categories
- ✅ Products
- ✅ Product Images
- ✅ Branch Inventory

The next document defines:

- Shopping Cart
- Pending Order
- Order
- OrderItem
- Payments
- Guest Checkout Data
- Inventory Transactions
- Order Status History

---

# Status

**🔒 LOCKED**
