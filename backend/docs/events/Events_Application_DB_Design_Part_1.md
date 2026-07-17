# Project Recon

# Events Application

# 🔒 Database Design — Part 1 (Core Event Models)

**Status:** 🔒 LOCKED

**Application:** `events`

> This document defines the core database entities of the Events application. It covers the shared Event model that serves as the foundation for all event types. Tournament, Workshop, Registration, and Match models are covered in subsequent documents.

---

# 1. Design Principles

The Events database follows these principles:

- Every model uses UUID as its primary key.
- Every business entity owns its own lifecycle.
- Business logic is implemented in Services, not Models.
- External providers (payments, storage, email, etc.) are never referenced directly by database models.
- Branch ownership is optional to support both branch-specific and global events.
- Event types extend a common Event model rather than duplicating shared fields.

---

# 2. Entity Overview

```text
    Branch (optional)
            │
            ▼
        Event
    /      |      \
   /       |       \
  ▼        ▼        ▼
General   Tournament workshop
```

Every Tournament and Workshop owns exactly one Event. A General Event exists without a specialized child model.

---

# 3. Event

## Purpose

The Event model stores all information shared by every event type.

Examples:

- Robotics Tournament
- AI Workshop
- Programming Bootcamp
- Future Conference
- Future Exhibition

Every specialized event extends this model.

---

# 4. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| branch | FK → Branch | ❌ | NULL indicates a Global Event |
| title | VARCHAR(255) | ✅ | Event title |
| description | TEXT | ✅ | Event description |
| banner | File/Image | ❌ | Stored using configured storage provider |
| location | VARCHAR(255) | ✅ | Physical or online location |
|event_type | ENUM | ✅ |General, Tournament, Workshop|
| start_datetime | DATETIME | ✅ | Event start |
| end_datetime | DATETIME | ✅ | Event end |
| visibility | ENUM | ✅ | Public or Private |
| status | ENUM | ✅ | Draft, Published, Cancelled, Completed |
| registration_enabled | BOOLEAN | ✅ | Enables registration |
| registration_mode | ENUM | ❌ | Required only when registration is enabled |
| registration_deadline | DATETIME | ❌ | Required only when registration is enabled |
| payment_required | BOOLEAN | ✅ | Indicates whether payment is required for registration |
| registration_fee | DECIMAL(10,2) | ❌ | Required only when payment is enabled |
| capacity | INTEGER | ❌ | NULL means unlimited registrations |
| enrolled_count | INTEGER | ✅ | Maintained automatically by services |
| youtube_live_url | URL | ❌ | Optional YouTube Live stream |
| is_active | BOOLEAN | ✅ | Enables/disables the event |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 5. Relationships

## Branch → Event

```text
Branch

1

↓

∞

Event
```

### Rules

- Branch is optional.
- NULL represents a Global Event.
- Deleting a Branch must not automatically delete Events.

---

## Event → Specialized Event

```text
Event

1

↓

1

Tournament
```

or

```text
Event

1

↓

1

Workshop
```

### Rules

- Every Tournament owns exactly one Event.
- Every Workshop owns exactly one Event.
- An Event belongs to exactly one specialized event type.
- Tournament and Workshop cannot exist without their parent Event.

---

# 6. Registration Configuration Rules

## Registration Disabled

When:

```text
registration_enabled = False
```

The following rules apply:

```text
registration_mode = NULL

registration_deadline = NULL

payment_required = False

registration_fee = NULL
```

---

## Registration Enabled

When:

```text
registration_enabled = True
```

The following are required:

- registration_mode

The following become optional depending on configuration:

- registration_deadline
- payment_required
- registration_fee

---

## Payment Rules

When:

```text
payment_required = True
```

Then:

```text
registration_fee > 0
```

---

When:

```text
payment_required = False
```

Then:

```text
registration_fee = NULL
```

---

# 7. Capacity Rules

Capacity is optional.

```text
capacity = NULL
```

means:

Unlimited registrations.

Otherwise:

Capacity defines the maximum number of accepted registrations.

The value of `enrolled_count` is maintained by the service layer and must never exceed `capacity`.

---

# 8. Event Status

Stored values:

- DRAFT
- PUBLISHED
- CANCELLED
- COMPLETED

These values are managed by authorized staff.

---

## Computed Event State

The following values are **not stored**.

They are calculated dynamically.

### Future

```text
Current Time < Start Time
```

---

### Live

```text
Start Time ≤ Current Time ≤ End Time
```

---

### Past

```text
Current Time > End Time
```

---

# 9. Visibility

Supported values:

- PUBLIC
- PRIVATE

Rules:

- Only Published + Public events are visible to unauthenticated users.
- Private events are visible only to authorized users.

---

# 10. Registration Modes

Supported values:

- NONE
- PUBLIC
- STUDENT
- SUBPROGRAM_STUDENT

### NONE

Registration disabled.

---

### PUBLIC

Anyone may register.

---

### STUDENT

Only authenticated students may register.

---

### SUBPROGRAM_STUDENT

Only students enrolled in selected Academic Sub Programs may register.

---

# 11. Business Rules

- Every specialized event owns exactly one Event.
- Branch is optional.
- NULL Branch indicates a Global Event.
- Event status is managed independently from computed event state.
- Registration is configurable per event.
- Capacity is optional.
- Registration fee is required only when payment is enabled.
- Events never communicate directly with payment providers.
- Online payments are handled through the Shared Payment Service.
- Live, Future, and Past states are computed dynamically and are never stored.

---

# 12. Index Recommendations

Create indexes on:

- branch
- status
- visibility
- start_datetime
- end_datetime
- is_active

Composite indexes:

- (status, visibility)
- (branch, start_datetime)
- (branch, status)

---

# 13. Locked Decisions

The following decisions are finalized:

- Event is the parent model for all event types.
- Tournament and Workshop extend Event.
- Branch is nullable to support Global Events.
- Registration is optional and configurable.
- Capacity is optional.
- Payment configuration is independent of registration configuration.
- Event states (Future, Live, Past) are computed rather than stored.
- External payment providers are accessed only through the Shared Payment Service.
- Business logic remains outside the models.

---

# Status

**🔒 LOCKED**
