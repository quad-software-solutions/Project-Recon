# Project Recon

# Store Application

# 🔒 Architecture Design

**Status:** 🔒 LOCKED

**Application:** `store`

---

# Overview

The Store application provides a complete e-commerce solution for Project Recon.

Its primary purpose is to allow customers to purchase physical products from the organization's branches while providing staff with inventory and order management capabilities.

The Store integrates with:

- Accounts
- Shared Payment
- Shared Notification
- Shared Audit
- Branch Management

The Store **never communicates directly with payment providers**. All payment processing is delegated to the Shared Payment application.

---

# Core Principles

- Physical products only.
- One Product exists globally.
- Product prices are global.
- Inventory is managed independently by each branch.
- Customers can view stock availability across all branches.
- One Order belongs to one Branch.
- Guest checkout is supported.
- Authenticated customers are supported.
- Shopping Cart is temporary.
- Checkout creates a Pending Order.
- Payment is required before an Order is confirmed.
- Pending Orders automatically expire if payment is not completed.
- Inventory is reduced only after successful payment verification.
- Customers cannot cancel paid orders.
- Refunds are handled manually by authorized staff.
- Order confirmation emails are delegated to Shared Notification.
- Audit logging is delegated to Shared Audit.

---

# Business Modules

The Store application consists of the following business domains:

- Product Catalog
- Product Categories
- Product Images
- Branch Inventory
- Shopping Cart
- Checkout
- Pending Orders
- Orders
- Payments
- Inventory Management

---

# Product Catalog

The Product Catalog contains every physical product offered by the organization.

Examples:

- Robotics Kits
- Motors
- Sensors
- Electronics
- Competition Parts
- Books
- Apparel
- Accessories

Each Product:

- belongs to one Category
- has one global selling price
- may have multiple images
- may exist in multiple branches
- may be activated or archived

Products represent the organization's inventory items, not branch-specific stock.

---

# Categories

Categories organize products into logical groups.

Examples:

- Robotics Kits
- Parts
- Electronics
- Apparel
- Books
- Accessories

Categories are managed only by administrators.

Products always belong to one Category.

---

# Product Images

Each Product may have multiple images.

## Business Rules

- Multiple images are supported.
- One image is marked as the Primary Image.
- Images have display order.
- Primary Image is displayed in product listings.
- Additional images are shown on the Product details page.

---

# Branch Inventory

Inventory belongs to branches.

Products never store stock quantities.

## Relationship

```text
Product
      │
      ▼
Branch Inventory
```

Example

```text
Robotics Kit

Addis Branch
12 Available

-------------------

Bole Branch
5 Available

-------------------

Adama Branch
Out of Stock
```

Customers can view inventory availability for every branch before purchasing.

Prices remain identical across all branches.

---

# Shopping Cart

The Shopping Cart is temporary.

Its purpose is to prepare a purchase.

Customers may:

- Add Products
- Remove Products
- Update Quantities
- View Totals

The Shopping Cart is not a permanent business record.

No inventory is reserved while items remain in the Shopping Cart.

## Cart Expiration

Shopping Carts automatically expire.

### Business Rules

- Shopping Carts expire after **30 days** of inactivity.
- Expired Shopping Carts are automatically removed.
- Expired Shopping Carts never affect inventory.
- Expired Shopping Carts never create Orders.

---

# Checkout

Checkout transforms the Shopping Cart into a Pending Order.

Before checkout succeeds the system validates:

- Product exists
- Product is active
- Requested quantity
- Branch inventory
- Product pricing

Only successful validation allows payment initialization.

---

# Pending Order

A Pending Order represents a purchase awaiting payment.

## Purpose

- Preserve checkout information.
- Provide a payment reference.
- Prevent duplicate Orders.
- Track payment progress.

A Pending Order is not yet considered a successful purchase.

## Pending Order Expiration

Pending Orders automatically expire.

### Business Rules

- Pending Orders expire after **30 minutes** if payment is not successfully verified.
- Expired Pending Orders cannot be completed.
- Customers must restart Checkout after expiration.

---

# Payment Flow

Payment is completely delegated to the Shared Payment application.

## Workflow

```text
Shopping Cart
        │
        ▼
Checkout
        │
        ▼
Pending Order
        │
        ▼
Initialize Payment
        │
        ▼
Shared Payment
        │
        ▼
Chapa / Stripe
        │
        ▼
Verification Callback
        │
        ▼
Shared Payment Verification
        │
        ▼
Store Payment Service
        │
        ▼
Confirm Order
        │
        ▼
Reduce Inventory
        │
        ▼
Generate Order Number
        │
        ▼
Confirmation Email
```

The Store never communicates directly with payment providers.

The Store only reacts to successful payment verification.

---

# Order Confirmation

After successful payment verification:

- Payment is confirmed.
- Order becomes **PAID**.
- Inventory is reduced.
- Order Number is generated.
- Confirmation Email is sent.
- Staff may begin fulfillment.

---

# Order Number

Every confirmed Order contains:

### Internal Identifier

```text
UUID
```

### Customer Identifier

```text
ORD-branch initials-2026-000001
```

The Order Number is used for:

- Customer communication
- Pickup
- Staff lookup
- Email notifications

Customers never interact with internal UUIDs.

---

# Order Processing

After payment, staff fulfill the Order.

## Workflow

```text
PAID

↓

PREPARING

↓

READY_FOR_PICKUP

↓

COMPLETED
```

### Additional Statuses

- PAYMENT_FAILED
- CANCELLED
- REFUNDED

Customers cannot cancel paid Orders.

Refunds and cancellations are administrative actions only.

---

# Pickup

After payment the customer receives:

- Order Number
- Confirmation Email

When collecting an Order the customer presents either:

- Order Number

or

- Confirmation Email

Staff locate the Order.

Verify the customer.

Hand over the Products.

Mark the Order as **COMPLETED**.

---

# Guest Checkout

Guests may purchase Products without creating an Account.

The following information is collected:

- Full Name
- Email Address
- Phone Number

Guest information is stored with the Order.

It is used for:

- Payment
- Order Confirmation
- Pickup Verification
- Customer Communication

Guest checkout never creates a User account.

---

# Authenticated Customers

Authenticated customers may:

- Browse Products
- Purchase Products
- View Order History
- Track Order Status

Their existing Account information is reused during Checkout.

---

# Inventory Management

Inventory belongs to Branches.

Each Branch manages its own stock.

Products remain global.

Example

```text
Robot Kit

↓

Addis Branch
15

↓

Bole Branch
8

↓

Adama Branch
0
```

Inventory is reduced only after successful payment verification.

No stock reservation occurs before payment.

---

# Refunds & Administrative Cancellations

Customers cannot cancel paid Orders.

When exceptional situations occur, authorized staff may manually perform:

- Refunds
- Administrative Cancellations

These actions follow the organization's internal business procedures.

Payment processing remains the responsibility of the Shared Payment application.

---

# Email Notifications

The Store delegates all notifications to the Shared Notification application.

Notifications include:

- Payment Successful
- Order Ready for Pickup
- Order Completed
- Refund Processed

The Store never constructs or sends emails directly.

---

# Audit Logging

All significant Store actions are recorded through the Shared Audit application.

Examples:

- Product creation
- Product updates
- Product archival
- Inventory adjustments
- Order status changes
- Refund processing
- Administrative actions

The Store does not implement its own audit mechanism.

---

# Roles & Permissions

## Super Admin

Full Store access.

May manage:

- Products
- Categories
- Inventory
- Orders
- Reports

---

## Branch Manager

Scoped to assigned Branches.

May manage:

- Branch Inventory
- Branch Orders
- Pickup
- Order Processing

Cannot access other Branches.

---

## Customer

Authenticated customers may:

- Browse Products
- Purchase Products
- View own Orders
- Track Order Status

---

## Guest Customer

May:

- Browse Products
- Purchase Products
- Receive Email Notifications

Guests cannot view historical Orders after purchase.

---

# Integration with Other Applications

## Accounts

Provides authenticated users and staff.

---

## Shared Payment

Responsible for:

- Payment Initialization
- Payment Verification
- Payment Providers
- Transaction Management

---

## Shared Notification

Responsible for:

- Order Confirmation Emails
- Pickup Notifications
- Completion Notifications
- Refund Notifications

---

## Shared Audit

Responsible for:

- Audit Logs
- Administrative History
- Inventory History
- Order Activity

---

## Branch Management

Provides:

- Branch Information
- Branch Ownership
- Inventory Ownership
- Pickup Location

---

# Overall Business Flow

```text
Products Published
        │
        ▼
Customer Browses Store
        │
        ▼
Shopping Cart
        │
        ▼
Checkout
        │
        ▼
Pending Order
        │
        ▼
Initialize Payment
        │
        ▼
Shared Payment
        │
        ▼
Customer Pays
        │
        ▼
Payment Verification
        │
        ▼
Order Confirmed
        │
        ▼
Reduce Branch Inventory
        │
        ▼
Generate Order Number
        │
        ▼
Confirmation Email
        │
        ▼
Preparing
        │
        ▼
Ready For Pickup
        │
        ▼
Customer Pickup
        │
        ▼
Completed
```

---

# Locked Business Rules

- Only physical products are supported.
- Products exist globally.
- Product prices are global.
- Inventory belongs to Branches.
- Customers can view stock availability for every Branch.
- Products support multiple images.
- One Product Image is designated as the Primary Image.
- Shopping Carts are temporary.
- Shopping Carts expire after **30 days** of inactivity.
- Checkout creates a Pending Order.
- Pending Orders expire after **30 minutes** if payment is not successfully verified.
- One Order belongs to exactly one Branch.
- Orders are confirmed only after successful payment verification.
- Payments are processed exclusively through the Shared Payment application.
- Inventory is reduced only after successful payment verification.
- Inventory is never reserved before payment.
- Guest customer information is stored with the Order.
- Customers cannot cancel paid Orders.
- Refunds and administrative cancellations are performed only by authorized staff.
- Every confirmed Order receives a human-readable Order Number.
- Email notifications are delegated to the Shared Notification application.
- Significant Store actions are recorded through the Shared Audit application.
- Branch Managers operate only within their assigned Branches.

---

# Status

**🔒 LOCKED**
