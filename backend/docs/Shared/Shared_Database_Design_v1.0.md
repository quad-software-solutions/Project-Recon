# Project Recon

# Shared Database Design v1.0

**Status:** LOCKED BEFORE IMPLEMENTATION

**App:** `shared`

---

# 1. Database Philosophy

Unlike business apps, the Shared app is service-oriented rather than data-oriented.

Most functionality is implemented through services instead of database models.

Shared should therefore contain as few database tables as possible.

---

# 2. Database Overview

Shared contains two database tables.

```text
shared
├── AuditLog
└── BankAccount
```

Email communicates directly with external providers and requires no database tables.

---

# 3. Entity Relationship Diagram

```text
                    +------------------+
                    |      User        |
                    +------------------+
                             ▲
                             │ actor (FK)
                             │
                     +------------------+
                     |    AuditLog      |
                     +------------------+
                             │
                             │ branch (FK)
                             ▼
                    +------------------+
                    |     Branch       |
                    +------------------+
```

AuditLog references Accounts using string model references (`settings.AUTH_USER_MODEL` and `"accounts.Branch"`), avoiding circular imports.

BankAccount is standalone with no foreign keys.

---

# 4. AuditLog

Purpose: Maintain a permanent audit trail of important system actions.

## Fields

### id

- UUID
- Primary Key

### actor

- ForeignKey → User
- Nullable
- Stores the authenticated user that performed the action.

### action

- CharField
- Uses Django TextChoices

Example values:

- CREATE
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- VERIFY_EMAIL
- CHANGE_PASSWORD
- RESET_PASSWORD
- ASSIGN_ROLE
- REMOVE_ROLE
- ACTIVATE
- DEACTIVATE

### resource_type

- CharField
- Stores the affected business entity name.

Examples:

- User
- Branch
- Student
- Product
- Order
- Event
- Attendance

### resource_id

- UUIDField
- Stores the UUID of the affected resource.

### branch

- ForeignKey → Branch
- Nullable
- Stores the branch associated with the action.

### ip_address

- GenericIPAddressField
- Nullable

### user_agent

- TextField
- Nullable

### details

- JSONField
- Nullable

### created_at

- DateTimeField
- Automatically generated.

---

# 5. BankAccount

Purpose: Store bank account details for payment collection.

## Fields

### id

- UUID
- Primary Key

### bank_name

- CharField(200)
- Required

### account_holder

- CharField(200)
- Required

### account_number

- CharField(100)
- Required

### branch

- CharField(200)
- Blank

### swift_code

- CharField(50)
- Blank

### iban

- CharField(50)
- Blank

### is_active

- BooleanField
- Default True

### notes

- TextField
- Blank

### created_at

- DateTimeField
- Auto-generated on creation.

### updated_at

- DateTimeField
- Auto-generated on update.

---

# 6. Relationships

- User (1) → (Many) AuditLog
- Branch (1) → (Many) AuditLog
- BankAccount has no foreign key relationships.

---

# 7. Referential Behavior

User deletion:

- on_delete=SET_NULL

Branch deletion:

- on_delete=SET_NULL

Audit history must always remain intact.

---

# 8. Recommended Indexes

AuditLog:

- created_at
- actor
- branch
- action
- resource_type
- resource_id

---

# 9. Constraints

Audit records are immutable.

- Never updated
- Never deleted

Only inserts are allowed through `log_action`.

BankAccount has no immutability constraints.

---

# 10. Shared Does NOT Store

- Email messages
- Email queue
- Payment transactions
- Payment history
- OTPs
- Sessions
- Authentication state

---

# 11. Future Expansion

Possible future infrastructure tables:

- SMSLog
- WebhookLog
- NotificationLog

Only when required.

---

# 12. Database Decision Log

| Decision | Choice |
|----------|--------|
| Number of Tables | 2 |
| AuditLog Table | Immutable, append-only |
| BankAccount Table | Mutable, CRUD |
| Primary Key | UUID (both tables) |
| Actor | FK → User |
| Branch | FK → Branch |
| Resource Reference | resource_type + resource_id |
| User Deletion | SET_NULL |
| Branch Deletion | SET_NULL |
| Audit Updates | Never |
| Audit Deletes | Never |
| Payment Tables | None |
| Email Tables | None |
| OTP Tables | None |

---

# 13. Database Summary

```text
shared
├── AuditLog
│   ├── id
│   ├── actor
│   ├── action
│   ├── resource_type
│   ├── resource_id
│   ├── branch
│   ├── ip_address
│   ├── user_agent
│   ├── details
│   └── created_at
│
└── BankAccount
    ├── id
    ├── bank_name
    ├── account_holder
    ├── account_number
    ├── branch
    ├── swift_code
    ├── iban
    ├── is_active
    ├── notes
    ├── created_at
    └── updated_at
```

---

**Status:** LOCKED
