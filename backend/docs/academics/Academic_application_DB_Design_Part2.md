# Project Recon

# Academic Application Database Design
## Part 2 — Enrollment & Academic Operations

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document defines the database design for the operational models of the Academic application. It focuses only on database architecture and intentionally excludes services, APIs, permissions, and implementation.

---

# 1. Scope

This document covers:

- Enrollment
- Enrollment Period
- Enrollment Payment
- Attendance Session
- Attendance Record

---

# 2. Entity Relationship Overview

```text
Student
    │
    │ 1
    ▼
Enrollment
    │
    ├──────────────────┐
    │                  │
    ▼                  ▼
Attendance Record   EnrollmentPayment
    ▲
    │
Attendance Session
    ▲
    │
Class

SubProgram
    │
    ▼
EnrollmentPeriod
```

---

# 3. Enrollment

## Purpose

Enrollment represents a student's participation in a Class.

A Student may have many enrollments throughout their academic journey.

Every enrollment belongs to exactly one Class.

Every enrollment belongs to exactly one Student.

Every enrollment owns exactly one Enrollment Payment.

---

## Relationships

```text
Student

1

↓

∞

Enrollment
```

```text
Class

1

↓

∞

Enrollment
```

```text
Enrollment

1

↓

1

Enrollment Payment
```

```text
Enrollment

1

↓

∞

Attendance Record
```

```text
Attendance Session

1

↓

∞

Attendance Record
```

```text
Class

1

↓

∞

Attendance Session
```

```text
Enrollment

1

↓

∞

Student Progress
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| student | ForeignKey | Yes | Student |
| class | ForeignKey | Yes | Teaching Class |
| enrolled_at | DateTime | Yes | Enrollment date |
| status | Choice | Yes | Enrollment lifecycle |
| remarks | Text | No | Optional notes |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Enrollment Status

```text
PENDING_PAYMENT

ACTIVE

COMPLETED

CANCELLED
```

---

## Constraints

A Student may enroll in multiple Classes.

A Class may contain multiple Students.

One Enrollment belongs to exactly one Student.

One Enrollment belongs to exactly one Class.

Only one active enrollment should exist for the same Student and Class.

---

## Indexes

- student
- class
- status
- enrolled_at

Composite:

```text
(student, class)
```

---

## Delete Policy

Enrollment records are never physically deleted.

Cancelled enrollments remain for historical reporting.

---

# 4. Enrollment Period

## Purpose

Controls when students are allowed to enroll into specific Programs and Sub Programs.

Enrollment periods primarily apply to Group Classes.

Individual Classes remain available for enrollment at any time.

---

## Relationships

```text
Branch

1

↓

∞

Enrollment Period
```

```text
Program

1

↓

∞

Enrollment Period
```

```text
SubProgram

1

↓

∞

Enrollment Period
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| branch | ForeignKey | Yes | Branch |
| program | ForeignKey | Yes | Program |
| sub_program | ForeignKey | Yes | Sub Program |
| class_type | Choice | Yes | Group / Individual |
| title | String | Yes | Administrative label |
| start_date | Date | Yes | Opening date |
| end_date | Date | Yes | Closing date |
| is_active | Boolean | Yes | Enable / Disable |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Class Type

```text
GROUP

INDIVIDUAL
```

---

## Business Scope

Enrollment Period belongs to:

- Branch
- Program
- Sub Program
- Class Type

This allows each branch to manage independent enrollment windows.

---

## Constraints

Program and Sub Program must match.

End Date must be greater than Start Date.

Only active periods are considered during enrollment.

Active enrollment periods must not overlap for the same:

```text
Branch

+

Program

+

Sub Program

+

Class Type
```

(Enforced by the service layer.)

---

## Indexes

- branch
- program
- sub_program
- class_type
- is_active
- start_date
- end_date

Composite:

```text
(branch, program, sub_program, class_type)
```

---

## Delete Policy

Enrollment Periods are never deleted after use.

Inactive periods remain for historical reference.

---

# 5. Enrollment Payment

## Purpose

Represents the one-time payment associated with an Enrollment.

Payments are enrollment-specific rather than generic.

---

## Relationships

```text
Enrollment

1

↓

1

Enrollment Payment
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| enrollment | OneToOne | Yes | Enrollment |
| amount | Decimal | Yes | Paid amount |
| payment_method | Choice | Yes | Cash / Online |
| payment_provider | Choice | No | Chapa / Stripe |
| transaction_reference | String | No | External reference |
| payment_date | DateTime | No | Payment completion |
| status | Choice | Yes | Payment status |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Payment Method

```text
CASH

ONLINE
```

---

## Payment Provider

```text
CHAPA

STRIPE
```

Provider is only required when:

```text
payment_method = ONLINE
```

---

## Payment Status

```text
PENDING

PAID

FAILED

REFUNDED

CANCELLED
```

---

## Constraints

Every Enrollment owns one Payment.

Payment amount must be greater than zero.

Payment Provider is required only for Online payments.

Cash payments never require transaction references.

Online payments should store the provider transaction reference.

---

## Indexes

- enrollment
- status
- payment_method
- payment_provider
- payment_date

---

## Delete Policy

Payments are permanent financial records.

Physical deletion is not allowed.

---

# 6. Attendance Session

## Purpose

Represents one teaching session for a Class.

A session is created once per class meeting.

---

## Business Context

Attendance is recorded per Class Session.

Teachers create one Attendance Session for each class meeting.

Students are then marked within that session.

This supports both Group and Individual classes without requiring different models.

For Individual classes, each Attendance Session simply contains one Attendance Record.

---

## Examples

- Robotics Class A, July 7, 2026, Topic: Sensors
- Python Evening Class, July 10, 2026, Topic: Functions

---

## Relationships

```text
Class

1

↓

∞

Attendance Session
```

```text
Attendance Session

1

↓

∞

Attendance Record
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| class | ForeignKey | Yes | Teaching Class |
| session_date | Date | Yes | Class meeting date |
| topic | String | No | Optional session topic |
| recorded_by | ForeignKey | Yes | Instructor who recorded |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Constraints

- Every Attendance Session belongs to one Class.
- Session Date is required.
- Recorded By must be an Instructor.

---

## Indexes

- class
- session_date
- recorded_by

Composite:

```text
(class, session_date)
```

---

## Delete Policy

Attendance Sessions should never be physically deleted.

Corrections should update or void the session.

---

# 7. Attendance Record

## Purpose

Represents one student's attendance for a specific Attendance Session.

---

## Relationships

```text
Attendance Session

1

↓

∞

Attendance Record
```

```text
Enrollment

1

↓

∞

Attendance Record
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| attendance_session | ForeignKey | Yes | Parent Session |
| enrollment | ForeignKey | Yes | Student Enrollment |
| status | Choice | Yes | Attendance result |
| remarks | Text | No | Optional notes |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Attendance Record Status

```text
PRESENT

ABSENT

LATE

EXCUSED
```

---

## Constraints

- Every Attendance Record belongs to one Attendance Session.
- Every Attendance Record belongs to one Enrollment.
- Only one Attendance Record may exist for the same (Attendance Session, Enrollment) combination.
- Attendance Record cannot exist without an Attendance Session.
- Attendance Record cannot exist without an Enrollment.

---

## Indexes

- attendance_session
- enrollment
- status

Composite:

```text
(attendance_session, enrollment)
```

---

## Delete Policy

Attendance Records should never be physically deleted.

Corrections should update the existing record.

---

# 8. Shared Enumerations

## Enrollment Status

```text
PENDING_PAYMENT

ACTIVE

COMPLETED

CANCELLED
```

---

## Payment Method

```text
CASH

ONLINE
```

---

## Payment Provider

```text
CHAPA

STRIPE
```

---

## Payment Status

```text
PENDING

PAID

FAILED

REFUNDED

CANCELLED
```

---

## Attendance Record Status

```text
PRESENT

ABSENT

LATE

EXCUSED
```

---

## Class Type

```text
GROUP

INDIVIDUAL
```

---

# 9. Summary Relationships

```text
Student
    │
    ▼
Enrollment
    ├──────────────────────┐
    │                      │
    ▼                      ▼
Attendance Record   EnrollmentPayment
    ▲
    │
Attendance Session
    ▲
    │
Class

Branch
    │
    ▼
EnrollmentPeriod
         ▲
         │
Program ─┼─ SubProgram
```

---

# 10. Locked Decisions

The following decisions are finalized.

- Every Student may have multiple Enrollments.
- Every Enrollment belongs to one Student.
- Every Enrollment belongs to one Class.
- Every Enrollment owns exactly one Enrollment Payment.
- Enrollment Payments represent one-time payments only.
- Online payments support multiple providers through the external payment integration configuration.
- Cash payments are recorded manually by the Secretary.
- Enrollment Periods are scoped by Branch, Program, Sub Program, and Class Type.
- Group enrollments require an active Enrollment Period.
- Individual enrollments are not restricted by Enrollment Periods.
- Attendance is recorded per Class Session through Attendance Sessions.
- Attendance Sessions are created once per class meeting.
- Attendance Records belong to an Attendance Session and reference the student's Enrollment.
- Attendance Sessions, Attendance Records, Payments, Enrollment Periods, and Enrollments are retained for historical purposes and are not physically deleted.

---

# Status

**🔒 LOCKED**
