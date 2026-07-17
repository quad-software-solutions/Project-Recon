# Project Recon

# Store Application

# 🔒 Services Design

**Status:** 🔒 LOCKED

**Application:** `store`

---

# Overview

This document defines the business services responsible for implementing the Store application's business logic.

Services encapsulate all business rules.

Views remain thin.

Models only store data.

Every modification to Store data passes through a Service.

---

# Design Principles

- Services own all business logic.
- Models never perform business operations.
- Views never contain business rules.
- Services communicate with Shared Payment.
- Services communicate with Shared Notification.
- Services communicate with Shared Audit.
- Services never communicate directly with payment providers.
- Services are reusable across APIs, Admin actions, and future integrations.

---

# Service Overview

The Store application consists of the following services:

- Category Service
- Product Service
- Product Image Service
- Branch Inventory Service
- Shopping Cart Service
- Checkout Service
- Pending Order Service
- Order Service
- Inventory Service
- Refund Service

---

# Category Service

## Responsibilities

- Create category
- Update category
- Activate category
- Deactivate category
- Validate uniqueness
- Prevent deletion while products exist

## Does NOT

- Manage products
- Manage inventory

---

# Product Service

## Responsibilities

- Create products
- Update products
- Archive products
- Restore archived products
- Activate products
- Deactivate products
- Validate SKU uniqueness
- Validate slug uniqueness

## Business Rules

- Products are global.
- Products own no inventory.
- Archived products cannot be purchased.
- Archived products remain visible in historical orders.

---

# Product Image Service

## Responsibilities

- Upload images
- Delete images
- Change primary image
- Reorder images

## Business Rules

- One primary image per product.
- Display order remains unique.
- Removing a primary image automatically promotes another image.

---

# Branch Inventory Service

## Responsibilities

- Add inventory
- Reduce inventory
- Transfer inventory between branches
- Correct inventory
- Validate stock availability

## Business Rules

- Inventory belongs to branches.
- Quantity can never become negative.
- Inventory updates generate audit records.

This service never processes customer purchases.

---

# Shopping Cart Service

## Responsibilities

- Create shopping cart
- Retrieve shopping cart
- Add products
- Remove products
- Update quantities
- Clear cart
- Delete expired carts

---

## Business Rules

Authenticated Users

- One active cart per user.
- Cart persists between sessions.
- Cart expires after 30 days of inactivity.

Guest Users

- One temporary cart per browser session.
- Cart exists only while the browser session is active.
- Closing the browser removes the cart.
- Guest carts are never stored as permanent business records.

---

## Validation

Before adding an item:

- Product exists
- Product is active
- Branch exists
- Inventory record exists
- Quantity > 0

Inventory is **not reserved**.

---

# Checkout Service

## Responsibilities

- Validate shopping cart
- Calculate totals
- Create Pending Order
- Initialize payment
- Send payment request to Shared Payment

---

## Validation

Checks

- Product availability
- Branch inventory
- Product status
- Quantities
- Prices

If validation fails

Checkout is rejected.

---

## Does NOT

- Deduct inventory
- Confirm payment
- Create completed orders

---

# Pending Order Service

## Responsibilities

- Create pending order
- Store checkout snapshot
- Store guest information
- Track payment state
- Expire unpaid pending orders

---

## Business Rules

- Pending Orders expire after 30 minutes.
- Pending Orders cannot be modified after payment initialization.
- Expired Pending Orders cannot be reused.

---

# Order Service

## Responsibilities

- Create confirmed order
- Generate order number
- Copy purchased items
- Maintain order history
- Change order status

---

## Creates

- Order
- Order Items
- Order Status History

---

## Business Rules

Orders are created **only** after successful payment verification.

Order numbers are unique.

Example

```text
RCN-2026-000245
```

Historical product information is copied into Order Items.

Future product changes never affect historical orders.

---

## Order Status Management

Allowed transitions

```text
Pending Payment

↓

Paid

↓

Preparing

↓

Ready for Pickup

↓

Completed
```

Administrative transitions

```text
Paid

↓

Refunded

--------------------

Paid

↓

Cancelled
```

Every transition creates an Order Status History record.

---

# Inventory Service

## Responsibilities

- Deduct inventory after successful payment
- Validate stock during deduction
- Prevent negative inventory
- Record inventory changes

---

## Business Rules

Inventory is deducted

ONLY AFTER

```text
Payment Verified
```

Never before.

Inventory updates occur atomically with order confirmation.

---

# Refund Service

## Responsibilities

- Process manual refunds
- Process administrative cancellations
- Update order status
- Trigger notifications
- Record audit logs

---

## Business Rules

Customers cannot request automatic refunds through the Store.

Authorized staff perform refunds manually according to organizational procedures.

The service updates Store records after payment handling has been completed through Shared Payment.

---

# Shared Payment Integration

The Store never communicates directly with Chapa or Stripe.

Workflow

```text
Checkout Service

↓

Shared Payment

↓

Payment Provider

↓

Verification Callback

↓

Shared Payment

↓

Order Service
```

---

# Shared Notification Integration

The Store requests notifications from Shared Notification.

Events

- Order Confirmed
- Ready for Pickup
- Order Completed
- Refund Processed

Notification content is not owned by the Store.

---

# Shared Audit Integration

Every significant operation records an audit event.

Examples

- Category created
- Product archived
- Inventory updated
- Pending Order expired
- Order created
- Refund processed

Audit storage belongs to Shared Audit.

---

# Overall Service Flow

```text
Shopping Cart

↓

Shopping Cart Service

↓

Checkout Service

↓

Pending Order Service

↓

Shared Payment

↓

Payment Verification

↓

Order Service

↓

Inventory Service

↓

Shared Notification

↓

Shared Audit
```

---

# Service Dependencies

```text
Category Service

↓

Product Service

↓

Product Image Service

↓

Branch Inventory Service

↓

Shopping Cart Service

↓

Checkout Service

↓

Pending Order Service

↓

Shared Payment

↓

Order Service

↓

Inventory Service

↓

Refund Service

↓

Shared Notification

↓

Shared Audit
```

---

# Locked Service Rules

- Services own all business logic.
- Views remain thin.
- Models remain passive.
- Products never own inventory.
- Inventory belongs to branches.
- Guest carts exist only during the active browser session.
- Authenticated carts expire after 30 days of inactivity.
- Checkout validates inventory but never reserves it.
- Checkout creates Pending Orders.
- Pending Orders expire after 30 minutes.
- Orders are created only after successful payment verification.
- Inventory is deducted only after successful payment verification.
- Product information is snapshotted into Order Items.
- Order status transitions create history records.
- Refunds are manual administrative actions.
- Shared Payment owns payment providers.
- Shared Notification owns customer notifications.
- Shared Audit owns audit records.

---

# Status

**🔒 LOCKED**
