# Project Recon

# Academic Application Database Design
## Part 2 — Enrollment & Academic Operations

**Status:** LOCKED

**Application:** `academic`

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

## Relationships

```
Student (1) → (∞) Enrollment
Class (1) → (∞) Enrollment
Enrollment (1) → (1) EnrollmentPayment
Enrollment (1) → (∞) AttendanceRecord
Enrollment (1) → (∞) StudentProgress
Enrollment (1) → (∞) BranchTransferRequest
Enrollment (1) → (0..1) Enrollment (transferred_from, self-referential)
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| student | ForeignKey | Yes | Student |
| enrolled_class | ForeignKey | Yes | Teaching Class |
| enrolled_at | DateTime | Yes | Enrollment date |
| status | Choice | Yes | Enrollment lifecycle |
| enrollment_number | String | No | Generated on payment approval |
| pending_code | String | No | Generated on self-service enrollment |
| verification_status | Choice | No | SUBMITTED / UNDER_REVIEW |
| rejection_reason | Text | No | Rejection explanation |
| transferred_from | ForeignKey(self) | No | Source enrollment in switch |
| remarks | Text | No | Optional notes |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Enrollment Status

```
PENDING_VERIFICATION
ACTIVE
COMPLETED
CANCELLED
REJECTED
```

## Verification Status

```
SUBMITTED
UNDER_REVIEW
```

## Constraints

- A Student may enroll in multiple Classes.
- A Class may contain multiple Students.
- Only one non-cancelled enrollment per Student and Class.
- `enrollment_number` and `pending_code` are each unique.

## Indexes

- student
- enrolled_class
- status
- enrolled_at
- enrollment_number
- pending_code

Composite: (student, enrolled_class)

## Delete Policy

Enrollment records are never physically deleted. Cancelled/rejected enrollments remain for historical reporting.

---

# 4. Enrollment Period

## Purpose

Controls when students are allowed to enroll into specific Programs and SubPrograms. Primarily applies to Group Classes.

## Relationships

```
Branch (1) → (∞) EnrollmentPeriod
Program (1) → (∞) EnrollmentPeriod
SubProgram (1) → (∞) EnrollmentPeriod
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| branch | ForeignKey | Yes | Branch |
| program | ForeignKey | Yes | Program |
| sub_program | ForeignKey | Yes | Sub Program |
| class_type | Choice | Yes | Group / Individual |
| class_period | Choice | No | Half Day / Full Day |
| title | String | Yes | Administrative label |
| start_date | Date | Yes | Opening date |
| end_date | Date | Yes | Closing date |
| is_active | Boolean | Yes | Enable / Disable |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Business Scope

Enrollment Period belongs to: Branch + Program + SubProgram + Class Type. This allows each branch to manage independent enrollment windows.

## Constraints

- Program and SubProgram must match.
- End Date must be greater than Start Date.
- Only active periods are considered during enrollment.
- Active periods must not overlap for the same (Branch, Program, SubProgram, Class Type) combination.

## Delete Policy

Enrollment Periods are never deleted after use. Inactive periods remain for historical reference.

---

# 5. Enrollment Payment

## Purpose

Represents the one-time payment associated with an Enrollment. Supports cash, bank transfer, and online verification workflows.

## Relationships

```
Enrollment (1) → (1) EnrollmentPayment
EnrollmentPayment (1) → (0..1) User (verified_by)
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| enrollment | OneToOne | Yes | Enrollment |
| amount | Decimal | Yes | Paid amount |
| payment_method | Choice | Yes | Cash / Online |
| transaction_reference | String | No | External reference |
| bank_name | String | No | Bank name for transfers |
| transfer_reference | String | No | Transfer slip reference |
| attachment | File | No | Payment proof upload |
| payment_date | DateTime | No | Payment completion |
| status | Choice | Yes | Payment status |
| verified_by | ForeignKey | No | Accounts.User who verified |
| verified_at | DateTime | No | When verified |
| verification_notes | Text | No | Admin notes |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Payment Method

```
CASH
BANK_TRANSFER
TELEBIRR
```

## Payment Status

```
PENDING
PENDING_VERIFICATION
VERIFIED
FAILED
REFUNDED
CANCELLED
```

## Constraints

- Every Enrollment owns one Payment.
- Payment amount must be greater than zero.
- Non-cash payments require transaction_reference, bank_name + transfer_reference, or attachment.

## Delete Policy

Payments are permanent financial records. Physical deletion is not allowed.

---

# 6. Attendance Session

## Purpose

Represents one teaching session for a Class. Created once per class meeting.

## Relationships

```
Class (1) → (∞) AttendanceSession
AttendanceSession (1) → (∞) AttendanceRecord
AttendanceSession (1) → (1) User (recorded_by)
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| enrolled_class | ForeignKey | Yes | Teaching Class |
| session_date | Date | Yes | Class meeting date |
| topic | String | No | Optional session topic |
| recorded_by | ForeignKey | Yes | Instructor who recorded |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Constraints

- Every Attendance Session belongs to one Class.
- One session per Class per day (unique constraint).
- Recorded By must be an Instructor for that Class.

## Delete Policy

Attendance Sessions should never be physically deleted. Corrections should update or void the session.

---

# 7. Attendance Record

## Purpose

Represents one student's attendance for a specific Attendance Session.

## Relationships

```
AttendanceSession (1) → (∞) AttendanceRecord
Enrollment (1) → (∞) AttendanceRecord
```

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

## Attendance Record Status

```
PRESENT
ABSENT
LATE
EXCUSED
```

## Constraints

- One record per Enrollment per Session (unique constraint).
- Record cannot exist without an Attendance Session.
- Record cannot exist without an Enrollment.

## Delete Policy

Attendance Records should never be physically deleted. Corrections should update the existing record.

---

# 8. Shared Enumerations

## Enrollment Status

```
PENDING_VERIFICATION
ACTIVE
COMPLETED
CANCELLED
REJECTED
```

## Payment Method

```
CASH
BANK_TRANSFER
TELEBIRR
```

## Payment Status

```
PENDING
PENDING_VERIFICATION
VERIFIED
FAILED
REFUNDED
CANCELLED
```

## Attendance Record Status

```
PRESENT
ABSENT
LATE
EXCUSED
```

## Class Type

```
GROUP
INDIVIDUAL
```

## Class Period

```
FULL_DAY
HALF_DAY
```

---

# 9. Locked Decisions

- Every Student may have multiple Enrollments.
- Every Enrollment has one Payment.
- Online enrollments use a verification workflow (PENDING_VERIFICATION → UNDER_REVIEW → VERIFIED/REJECTED).
- Enrollment number is generated on payment approval.
- Pending code is generated on self-service submission.
- Enrollment Periods are scoped by Branch, Program, SubProgram, Class Type, and Class Period.
- Group enrollments require an active Enrollment Period.
- Individual enrollments are not restricted by Enrollment Periods.
- Attendance is recorded per Class Session through Attendance Sessions.
- Attendance Records are permanent.

---

**Status:** LOCKED
