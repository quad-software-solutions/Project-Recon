# Project Recon

# Shared App Architecture v1.0

**Status:** LOCKED

**App:** `shared`

**Purpose:** Provide reusable infrastructure services used by multiple business modules while remaining completely independent of business logic.

---

# 1. Purpose

The **Shared** app contains infrastructure that:

- Is used by multiple business apps.
- Is not already provided by Django or Django REST Framework.
- Is independent of any business domain.

It **never owns business entities** or **business workflows**.

---

# 2. Architecture Principles

The Shared app follows the Project Recon engineering principles.

## Django First

If Django already provides a feature, use it.

Do not build wrappers around Django.

Examples:

- File Storage → Django Storage
- Static Files → Django
- Authentication → Django Auth
- Responses → DRF Response
- Validation → Django/DRF Validators

## Infrastructure Only

Shared contains reusable infrastructure only.

No business rules.

No business workflows.

No business models.

## Keep It Simple

Avoid unnecessary abstractions.

Only create additional layers when they solve a real problem.

---

# 3. Responsibilities

Shared currently owns two infrastructure domains.

```text
shared/
│
├── audit/
├── bank/
└── email/
```

Future additions (only when needed):

```text
sms/
notification/
```

---

# 4. What Shared Does NOT Own

Shared never owns:

- Users
- Branches
- Students
- Products
- Orders
- Events
- Roles
- Authentication
- OTPs
- Email Verification
- Password Reset Logic
- Business Permissions
- Storage
- Celery
- Static Files
- Validators
- Exceptions
- Response Helpers

---

# 5. Dependency Rules

Business modules may depend on Shared.

```text
accounts
academic
events
store
cms
      │
      ▼
    shared
```

Shared must never import or depend on any business module.

---

# 6. Folder Structure

```text
shared/
│
├── audit/
│   ├── models/
│   │   ├── __init__.py
│   │   └── audit_log.py
│   ├── api/
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── services.py
│   ├── admin.py
│   └── tests/
│
├── bank/
│   ├── models/
│   │   ├── __init__.py
│   │   └── bank_account.py
│   ├── api/
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── admin.py
│   └── tests/
│
├── email/
│   ├── services.py
│   └── tests/
│
├── validators.py
├── apps.py
└── __init__.py
```

---

# 7. Email Infrastructure

Purpose:

Provide a unified email sending interface.

Business modules communicate only with `send_email()`.

Responsibilities:

- Send plain-text emails using Django's send_mail.
- Log all sent emails via `log_action`.

Uses Django's built-in mail backend — no custom provider abstraction.

Configuration lives in Django settings.

Email does **not** own OTP generation, verification workflows, password reset workflows, or business logic.

---

# 8. Bank Account Infrastructure

Purpose:

Store and manage bank account details for payment collection.

Model: BankAccount

- bank_name, account_holder, account_number, branch, swift_code, iban, is_active, notes
- UUID primary key, timestamps

API:

- GET /api/v1/bank-accounts/ — list (any authenticated user)
- POST /api/v1/bank-accounts/ — create (super admin only)
- GET /api/v1/bank-accounts/{id}/ — detail (any authenticated user)
- PUT /api/v1/bank-accounts/{id}/ — update (super admin only)
- PATCH /api/v1/bank-accounts/{id}/ — partial update (super admin only)
- DELETE /api/v1/bank-accounts/{id}/ — destroy (super admin only)

No service layer — CRUD logic lives in the viewset.

---

# 9. Audit Infrastructure

Purpose:

Maintain an immutable audit trail for accountability and security.

AuditLog fields:

- id
- actor
- action
- resource_type
- resource_id
- branch
- ip_address
- user_agent
- details
- created_at

Rules:

- Immutable
- Never updated
- Never deleted
- Written only through `log_action()`
- Read-only API
- Does not trigger business logic
- Does not modify business data

API:

- GET /api/v1/audit/
- GET /api/v1/audit/{id}/

---

# 10. External Configuration

External integrations live under:

```text
config/
├── settings.py
└── integrations/
    ├── email.py
    ├── celery.py
    └── storage.py
```

Shared never reads `.env` directly.

It only reads Django settings.

---

# 11. Cross Module Usage

- Accounts → EmailService / AuditService
- Academic → AuditService
- Events → AuditService
- Store → AuditService
- CMS → EmailService / AuditService

---

# 12. Design Rules

- Shared owns infrastructure only.
- Shared never imports business modules.
- Shared never duplicates Django functionality.
- Business modules communicate only with Shared services.

---

# 13. Architecture Decision Log

| Decision | Choice |
|----------|--------|
| Purpose | Infrastructure Only |
| Domains | Audit, Email, Bank |
| Storage | Django Storage |
| Static Files | Django |
| Authentication | Django |
| Responses | DRF |
| Validators | Django/App-specific |
| Exceptions | Django/App-specific |
| Celery | Config only |
| Provider Configuration | config/integrations |
| Audit API | shared.audit |
| Bank API | shared.bank |
| Audit Records | Immutable |
| Bank Records | Mutable |

**Status:** LOCKED
