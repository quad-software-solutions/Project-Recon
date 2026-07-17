# Project Recon

# Events Application

# 🔒 Database Design — Part 3 (Workshop, Event Registration & Payment)

**Status:** 🔒 LOCKED

**Application:** `events`

> This document defines the Workshop, Event Registration, and Payment database models. It builds upon the Event model defined in Database Design – Part 1 and the Tournament models defined in Database Design – Part 2.

---

# 1. Entity Overview

```text
Event
│
├───────────────┐
│               │
▼               ▼
Workshop   EventRegistration
                 │
                 ▼
        Shared Payment
```

Workshop extends Event.

Event Registration belongs to an Event.

Payments are handled by the Shared Payment application.

---

# 2. Workshop

## Purpose

Represents an educational or training event.

Examples:

- Robotics Workshop
- AI Bootcamp
- Python Fundamentals
- Web Development Masterclass

Every Workshop extends exactly one Event with event_type WORKSHOP.

---

# 3. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| event | OneToOne → Event | ✅ | Parent Event |
| instructor | FK → User | ✅ | Assigned instructor |
| duration_minutes | INTEGER | ✅ | Workshop duration in minutes |
| level | ENUM | ✅ | Beginner / Intermediate / Advanced |
| price | DECIMAL(10,2) | ❌ | Informational workshop price |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 4. Workshop Constraints

Every Workshop:

- Must belong to exactly one Event.
- Cannot exist without an Event.
- Must have one assigned instructor.
- Uses the registration configuration defined by its parent Event.

---

# 5. Event Registration

## Purpose

Represents one registration for an Event.

This model is shared by:

- Tournaments
- Workshops
- Future Event Types

Separate registration models are never created.

---

# 6. Registration Types

Two types of registrations are supported.

## Student Registration

Used for authenticated students.

The student is linked through the Academic application.

No duplicate student information is stored.

---

## Public Registration

Used for users without an account.

Contact information is stored directly inside the registration.

---

# 7. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| event | FK → Event | ✅ | Parent Event |
| student | FK → StudentProfile | ❌ | Required for student registrations |
| public_full_name | VARCHAR(255) | ❌ | Public participant name |
| public_email | Email | ❌ | Public participant email |
| public_phone | VARCHAR(50) | ❌ | Public participant phone |
| public_organization | VARCHAR(255) | ❌ | School, Company or Club |
| registration_status | ENUM | ✅ | Registration status |
| payment_status | ENUM | ✅ | Payment status |
| registered_at | DATETIME | ✅ | Registration timestamp |
| approved_at | DATETIME | ❌ | Approval timestamp |
| cancelled_at | DATETIME | ❌ | Cancellation timestamp |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 8. Registration Status

Supported values:

- PENDING
- APPROVED
- REJECTED
- CANCELLED

---

# 9. Payment Status

The Events application reuses the Shared Payment statuses.

Supported values:

- PENDING
- PAID
- FAILED
- CANCELLED
- REFUNDED

---

# 10. Registration Constraints

Every Registration:

- Must belong to one Event.
- Cannot exist without an Event.
- Must satisfy the Event registration rules.
- Must respect Event capacity.
- Must satisfy the registration deadline.

Exactly one registration type must be used.

---

## Student Registration

When Registration Mode is:

- STUDENT
- SUBPROGRAM_STUDENT

Rules:

- student is required.
- public_full_name must be NULL.
- public_email must be NULL.
- public_phone must be NULL.
- public_organization must be NULL.

Student information is obtained from Student Profile and User Account.

No duplicate information is stored.

---

## Public Registration

When Registration Mode is:

PUBLIC

Rules:

- student must be NULL.
- public_full_name is required.
- public_email is required.
- public_phone is required.
- public_organization is optional.

Public users are not required to create an account.

---

# 11. Registration Rules

Only one active registration is allowed per participant for the same Event.

### Student Registration

Unique Constraint

```text
(event, student)
```

---

### Public Registration

Unique Constraint

```text
(event, public_email)
```

---

# 12. Payment Relationship

The Events application never owns payment records.

Instead, payment processing is delegated to the Shared Payment application.

```text
Event Registration
        │
        ▼
Shared Payment
        │
        ▼
Configured Provider
        │
        ▼
Chapa / Stripe / Future Providers
```

The Event Registration stores only the payment status.

Complete payment history remains inside the Shared Payment module.

---

# 13. Registration Workflow

```text
Registration Request
        │
        ▼
Business Validation
        │
        ▼
Capacity Validation
        │
        ▼
Registration Rule Validation
        │
        ▼
Payment (if required)
        │
        ▼
Registration Confirmed
```

---

# 14. Capacity Rules

If

```text
capacity = NULL
```

Unlimited registrations are allowed.

Otherwise

Approved registrations must never exceed the configured capacity.

Capacity enforcement is performed by the service layer.

---

# 15. Relationships

```text
Event

1

↓

1

Workshop
```

---

```text
Event

1

↓

∞

EventRegistration
```

---

```text
StudentProfile

1

↓

∞

EventRegistration
```

---

# 16. Delete Rules

Deleting an Event deletes:

- Workshop
- Event Registrations

Deleting an Event Registration:

- Does not delete Shared Payment records.
- Does not modify payment history.

---

# 17. Index Recommendations

## Workshop

Indexes

- instructor

---

## Event Registration

Indexes

- event
- student
- registration_status
- payment_status
- registered_at

Composite Indexes

- (event, registration_status)
- (event, payment_status)
- (event, public_email)

---

# 18. Business Rules

- Workshop extends Event.
- Event Registration belongs to Event.
- One Registration model supports every Event type.
- Student information is never duplicated inside Event Registration.
- Public participant information exists only for public registrations.
- Every registration is either a Student Registration or a Public Registration, never both.
- Payments are handled entirely by the Shared Payment application.
- Events never communicate directly with Chapa, Stripe, or any payment provider.
- Capacity validation is handled by the service layer.
- Registration eligibility is determined entirely by the parent Event configuration.

---

# 19. Locked Decisions

The following decisions are finalized.

- Workshop extends Event.
- Event Registration is shared across all Event types.
- Public and authenticated users share the same registration model.
- Student registrations reference StudentProfile.
- Public registrations store their own contact information.
- Registration and Payment maintain independent statuses.
- Payment transactions belong exclusively to the Shared Payment application.
- Events only reference payment status.
- Provider-specific payment information is never stored inside the Events application.
- Capacity validation is performed by the service layer.
- Registration eligibility is determined by the parent Event configuration.

---

# Status

**🔒 LOCKED**
