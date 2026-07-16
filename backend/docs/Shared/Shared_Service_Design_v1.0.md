# Project Recon

# Shared Services Design v1.0

**Status:** LOCKED

**App:** `shared`

---

# 1. Philosophy

The Shared app exists to provide reusable infrastructure for business modules.

It contains **no business logic**.

It contains **no business workflows**.

Business modules remain responsible for deciding **when** and **why** shared services are called.

Shared services simply provide infrastructure capabilities.

---

# 2. Services Overview

The Shared app contains exactly **two services**.

```text
shared/
│
├── audit/
│   └── services.py
│
└── email/
    └── services.py
```

No additional services should be added unless there is a concrete business requirement.

---

# 3. AuditService

## Purpose

Provide a centralized way to create immutable audit records.

AuditService never:

- modifies business data
- performs authorization
- executes business workflows

It only creates audit records.

---

## Public API

### log_action()

Creates a new audit record.

### Parameters

```python
actor
action
resource_type
resource_id
branch=None
ip_address=None
user_agent=None
details=None
```

### Returns

```python
AuditLog
```

---

## Example

```python
log_action(
    actor=request.user,
    action="CREATE",
    resource_type="Branch",
    resource_id=branch.id,
    branch=branch,
    ip_address=request.META.get("REMOTE_ADDR"),
    user_agent=request.META.get("HTTP_USER_AGENT"),
)
```

---

## Rules

- Always create records.
- Never update records.
- Never delete records.
- Never swallow exceptions.
- Never modify business models.
- Never call business services.
- Never start database transactions.

---

## Used By

- Accounts
- Academic
- Events
- Store
- CMS

---

# 4. EmailService

## Purpose

Provide one unified interface for sending emails.

Business modules never communicate with email providers directly.

---

## Responsibilities

- Send plain-text emails using Django's `send_mail`.
- Log all sent emails via `log_action`.

---

## Public API

### send_email()

### Parameters

```python
to
subject
body
```

### Returns

```python
True
```

In test/debug mode the email is written to stderr instead of being dispatched.

---

## Rules

- Plain text only.
- No HTML templates.
- No template rendering.
- No OTP generation.
- No verification logic.
- No retry logic.
- No queueing.
- No business workflows.

---

## Used By

Accounts

- Email Verification
- Login OTP
- Password Reset

Academic

- Registration Notifications

Events

- Event Notifications

Store

- Order Confirmation

CMS

- Contact Messages

---

# 5. Service Communication Rules

Business modules communicate with Shared.

Shared communicates with external infrastructure.

```text
Business Apps
      │
      ▼
──────────────────────────
AuditService
EmailService
──────────────────────────
      │
      ▼
Database / External APIs
```

Shared services must never communicate with business services.

Shared must never import business modules.

---

# 6. Error Handling

Services do not define custom exception classes. Errors propagate directly from Django's mail backend.

Business modules decide how to handle failures.

---

# 7. Transactions

Shared services never create database transactions.

Transactions belong to business services.

Example

```text
UserService

↓

transaction.atomic()

↓

log_action()

↓

send_email()
```

---

# 8. Dependency Rules

Allowed

```text
Business Apps
      │
      ▼
    Shared
```

Forbidden

```text
Shared
  │
  ▼
Business Apps
```

---

# 9. Design Rules

Every Shared service must:

- Have a single responsibility.
- Expose a small public API.
- Hide external dependencies.
- Be stateless.
- Never contain business workflows.
- Never import business modules.
- Never depend on another business service unless absolutely required.

---

# 10. Future Expansion

Future infrastructure services may include:

```text
SmsService

PushNotificationService
```

These should only be added when a real business requirement exists.

---

# 11. Service Decision Log

| Decision | Choice |
|----------|--------|
| Services | Audit, Email |
| Public APIs | Minimal |
| Provider Pattern | No |
| Registry Pattern | No |
| Base Provider Class | No |
| Email Templates | No |
| HTML Emails | No |
| Plain Text Emails | Yes |
| Business Logic | Never |
| Transactions | Business Layer |
| Retry Logic | No |
| Queueing | No |
| Service State | Stateless |

---

# 12. Architecture Summary

```text
Business Apps
        │
        ▼
────────────────────────────
AuditService
EmailService
────────────────────────────
        │
        ▼
Database / External Providers
```

---

# 13. Locked Rules

- Shared owns infrastructure only.
- Business modules decide when to call shared services.
- Shared services never own business workflows.
- Shared services never modify business entities.
- Shared never imports business apps.
- Shared remains independent of every business domain.

---

# Status

**LOCKED**
