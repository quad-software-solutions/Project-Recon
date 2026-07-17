# Project Recon

# Store Application

# 🔒 Database Design – Part 2

**Status:** 🔒 LOCKED

**Application:** `store`

---

# Overview

This document defines the transactional database structure of the Store application.

Part 2 focuses on:

- Shopping Cart
- Shopping Cart Items
- Pending Orders
- Orders
- Order Items
- Guest Customer Information
- Order Status History

Payment records continue to be owned by the Shared Payment application.

---

# Design Principles

- Shopping Carts are temporary.
- Checkout creates a Pending Order.
- Orders are permanent.
- Order Items preserve historical purchase information.
- Guest information belongs to the Order.
- Payment belongs to the Shared Payment application.
- Inventory changes only after payment verification.

---

# Entity Relationship Overview

```text
ShoppingCart
      │
      ▼
ShoppingCartItem

----------------------------

PendingOrder
      │
      ▼
PendingOrderItem

----------------------------

Order
      │
      ├──────────────┐
      ▼              ▼
OrderItem     OrderStatusHistory
```

---

# ShoppingCart

Represents a temporary cart.

Authenticated users may own one cart.

Guest customers receive a temporary cart session.

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| user | FK → User | ❌ | Authenticated owner |
| session_key | String | ❌ | Guest session identifier |
| expires_at | DateTime | ✅ | Automatic expiration |
| created_at | DateTime | ✅ | Creation timestamp |
| updated_at | DateTime | ✅ | Last modification |

---

## Business Rules

- Either user or session_key must exist.
- Guests never create user accounts.
- One active cart per authenticated user.
- Carts expire after 30 days.

---

## Constraints

Authenticated

```text
One Active Cart per User
```

Guest

```text
One Active Cart per Browser Session
```

---

# ShoppingCartItem

Represents one product inside a Shopping Cart.

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| cart | FK → ShoppingCart | ✅ | Parent cart |
| product | FK → Product | ✅ | Selected product |
| branch | FK → Branch | ✅ | Selected branch |
| quantity | Integer | ✅ | Requested quantity |
| created_at | DateTime | ✅ | Creation timestamp |

---

## Business Rules

- Quantity must be greater than zero.
- Product must be active.
- Product must exist in selected branch.
- Inventory is not reserved.

---

## Constraints

Unique

```text
(cart, product, branch)
```

---

# PendingOrder

Represents checkout awaiting payment.

Created immediately before payment initialization.

---

## Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| user | FK → User | ❌ | Authenticated customer |
| branch | FK → Branch | ✅ | Pickup branch |
| payment_reference | String | ❌ | Shared Payment reference |
| subtotal | Decimal | ✅ | Order subtotal |
| total | Decimal | ✅ | Final payable amount |
| expires_at | DateTime | ✅ | Payment timeout |
| created_at | DateTime | ✅ | Creation timestamp |

---

## Guest Information

Stored directly on Pending Order.

| Field | Type |
|------|------|
| guest_name | String |
| guest_email | String |
| guest_phone | String |

Only populated for guest checkout.

---

## Business Rules

- Pending Orders expire after 30 minutes.
- No inventory deduction occurs.
- Cannot be modified after payment initialization.

---

# PendingOrderItem

Represents products awaiting payment.

---

## Fields

| Field | Type |
|------|------|
| id | UUID |
| pending_order | FK → PendingOrder |
| product | FK → Product |
| quantity | Integer |
| unit_price | Decimal |
| subtotal | Decimal |

---

## Business Rules

Prices are copied from Product during checkout.

Future product price changes never affect Pending Orders.

---

# Order

Represents a successful purchase.

Created only after payment verification.

---

## Fields

| Field | Type | Required |
|------|------|----------|
| id | UUID | ✅ |
| order_number | String | ✅ |
| user | FK → User | ❌ |
| branch | FK → Branch | ✅ |
| payment_reference | String | ✅ |
| subtotal | Decimal | ✅ |
| total | Decimal | ✅ |
| status | Enum | ✅ |
| paid_at | DateTime | ✅ |
| completed_at | DateTime | ❌ |
| created_at | DateTime | ✅ |

---

## Guest Information

Guest information is permanently stored.

| Field | Type |
|------|------|
| guest_name | String |
| guest_email | String |
| guest_phone | String |

---

## Business Rules

- Created only after payment verification.
- Order Number is unique.
- Orders are permanent.
- Orders are never deleted.

---

## Order Number

Example

```text
ORD-branch initials-2026-000125
```

Generated after successful payment.

Unique across the Store.

---

# OrderItem

Represents one purchased product.

OrderItems preserve historical purchase information.

---

## Fields

| Field | Type |
|------|------|
| id | UUID |
| order | FK → Order |
| product | FK → Product |
| product_name | String |
| sku | String |
| quantity | Integer |
| unit_price | Decimal |
| subtotal | Decimal |

---

## Why Duplicate Product Information?

Historical orders must remain unchanged.

If later

- Product name changes
- SKU changes
- Product archived

the Order still displays exactly what the customer purchased.

---

## Business Rules

- One Order has many OrderItems.
- Prices never change after purchase.
- Product information is snapshotted.

---

# Order Status History

Tracks every Order status change.

---

## Fields

| Field | Type |
|------|------|
| id | UUID |
| order | FK → Order |
| previous_status | Enum |
| new_status | Enum |
| changed_by | FK → User |
| changed_at | DateTime |
| notes | Text |

---

## Business Rules

Every status transition is recorded.

Example

```text
PAID

↓

PREPARING

↓

READY_FOR_PICKUP

↓

COMPLETED
```

---

# Relationships

```text
ShoppingCart
      │
      ▼
ShoppingCartItem

------------------------

PendingOrder
      │
      ▼
PendingOrderItem

------------------------

Order
      │
      ├─────────────┐
      ▼             ▼
OrderItem   OrderStatusHistory
```

---

# Database Integrity Rules

## Shopping Cart

- One active cart per authenticated user.
- Guest carts use sessions.
- Auto expires.

---

## Pending Order

- Expires after 30 minutes.
- Never deducts inventory.
- Converted into Order after payment verification.

---

## Order

- Permanent.
- Never deleted.
- One branch only.
- One Order Number only.

---

## OrderItem

- Product snapshot.
- Historical pricing preserved.
- Historical names preserved.

---

## Order Status History

Every status change creates one history record.

History cannot be modified.

---

# Index Recommendations

## ShoppingCart

- user
- session_key
- expires_at

---

## ShoppingCartItem

- cart
- product

---

## PendingOrder

- payment_reference
- expires_at

---

## Order

- order_number
- payment_reference
- branch
- status
- created_at

---

## OrderItem

- order
- product

---

## OrderStatusHistory

- order
- changed_at

---

# Part 2 Summary

This document defines:

- ✅ Shopping Cart
- ✅ Shopping Cart Items
- ✅ Pending Orders
- ✅ Pending Order Items
- ✅ Orders
- ✅ Order Items
- ✅ Guest Checkout Information
- ✅ Order Status History

Inventory movement and payment processing are handled through the Store Services and Shared Payment application.

---

# Status

**🔒 LOCKED**
