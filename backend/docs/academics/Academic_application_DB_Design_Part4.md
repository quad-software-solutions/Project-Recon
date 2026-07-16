# Project Recon

# Academic Application Database Design
## Part 4 — Global Database Rules & Final Specification

**Status:** LOCKED

**Application:** `academic`

---

# 1. Scope

This document finalizes the database design by defining:

- Complete Relationship Matrix
- Foreign Key Behaviors
- Delete Policies
- Unique Constraints
- Global Index Strategy
- Staff Attendance Models
- Branch Transfer Request Model
- Shared Enumerations

---

# 2. Complete Entity Relationship Diagram

```text
                                User
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
                  ▼                             ▼
              Student                     Instructor (via User FK)
                  │
                  ▼
              Enrollment
           ┌─────┴──────────────────┐
           │                        │
           ▼                        ▼
  Attendance Record        EnrollmentPayment
           ▲
           │
  Attendance Session
           ▲
           │
           Class

           StudentProgress
           ▲
           │
  LearningMilestone
           ▲
           │
       SubProgram
     ┌────┼───────────────┬───────────────┐
     │                    │               │
     ▼                    ▼               ▼
  Program          LearningMaterial   Certificate
                                             │
                                             ▼
                                   StudentCertificate

Branch
 │
 ├──────────────► Student
 ├──────────────► Class
 ├──────────────► EnrollmentPeriod
 └──────────────► StaffAttendanceSession

StaffAttendanceSession
 │
 └──────────────► StaffAttendanceRecord

Enrollment
 │
 └──────────────► BranchTransferRequest
```

---

# 3. Relationship Matrix

| Parent | Child | Relationship |
|---------|-------|-------------|
| User | Student | One to One |
| Branch | Student | One to Many |
| Branch | Class | One to Many |
| Branch | EnrollmentPeriod | One to Many |
| Branch | StaffAttendanceSession | One to Many |
| Program | SubProgram | One to Many |
| Program | EnrollmentPeriod | One to Many |
| SubProgram | Class | One to Many |
| SubProgram | LearningMaterial | One to Many |
| SubProgram | LearningMilestone | One to Many |
| SubProgram | Certificate | One to One |
| SubProgram | EnrollmentPeriod | One to Many |
| SubProgram | StudentCertificate | One to Many |
| User (Instructor) | Class | One to Many |
| User (recorded_by) | AttendanceSession | One to Many |
| User (uploaded_by) | LearningMaterial | One to Many |
| User (updated_by) | StudentProgress | One to Many |
| User (issued_by) | StudentCertificate | One to Many |
| User (verified_by) | EnrollmentPayment | One to Many |
| User (requested_by) | BranchTransferRequest | One to Many |
| User (approved_by) | BranchTransferRequest | One to Many |
| User (created_by) | StaffAttendanceSession | One to Many |
| User (staff_member) | StaffAttendanceRecord | One to Many |
| Student | Enrollment | One to Many |
| Student | StudentCertificate | One to Many |
| Class | Enrollment | One to Many |
| Class | AttendanceSession | One to Many |
| Class | LearningMilestone | One to Many (scope_class, nullable) |
| Enrollment | EnrollmentPayment | One to One |
| Enrollment | AttendanceRecord | One to Many |
| Enrollment | StudentProgress | One to Many |
| Enrollment | BranchTransferRequest | One to Many |
| Enrollment | Enrollment (self) | One to Many (transferred_from) |
| AttendanceSession | AttendanceRecord | One to Many |
| LearningMilestone | StudentProgress | One to Many |
| Certificate | StudentCertificate | One to Many |
| StaffAttendanceSession | StaffAttendanceRecord | One to Many (CASCADE) |

---

# 4. Foreign Key Behaviors

All foreign keys use `PROTECT` except where noted.

| Model | Parent | On Delete |
|---------|-------|-----------|
| Student | User | PROTECT |
| Student | Branch | PROTECT |
| SubProgram | Program | PROTECT |
| Class | SubProgram | PROTECT |
| Class | Branch | PROTECT |
| Class | User (instructor) | PROTECT |
| Enrollment | Student | PROTECT |
| Enrollment | Class | PROTECT |
| Enrollment | Enrollment (transferred_from) | SET_NULL |
| EnrollmentPayment | Enrollment | PROTECT |
| EnrollmentPayment | User (verified_by) | PROTECT |
| EnrollmentPeriod | Branch | PROTECT |
| EnrollmentPeriod | Program | PROTECT |
| EnrollmentPeriod | SubProgram | PROTECT |
| AttendanceSession | Class | PROTECT |
| AttendanceSession | User (recorded_by) | PROTECT |
| AttendanceRecord | AttendanceSession | PROTECT |
| AttendanceRecord | Enrollment | PROTECT |
| LearningMilestone | SubProgram | PROTECT |
| LearningMilestone | Class (scope) | PROTECT |
| StudentProgress | Enrollment | PROTECT |
| StudentProgress | LearningMilestone | PROTECT |
| StudentProgress | User (updated_by) | PROTECT |
| LearningMaterial | SubProgram | PROTECT |
| LearningMaterial | User (uploaded_by) | PROTECT |
| Certificate | SubProgram | PROTECT |
| StudentCertificate | Student | PROTECT |
| StudentCertificate | Certificate | PROTECT |
| StudentCertificate | SubProgram | PROTECT |
| StudentCertificate | User (issued_by) | PROTECT |
| StaffAttendanceSession | Branch | PROTECT |
| StaffAttendanceSession | User (created_by) | PROTECT |
| StaffAttendanceRecord | StaffAttendanceSession | **CASCADE** |
| StaffAttendanceRecord | User (staff_member) | PROTECT |
| BranchTransferRequest | Enrollment | **CASCADE** |
| BranchTransferRequest | Branch (from/to) | PROTECT |
| BranchTransferRequest | Class (target) | PROTECT |
| BranchTransferRequest | User (requested_by) | PROTECT |
| BranchTransferRequest | User (approved_by) | PROTECT |

---

# 5. Delete Policy

The following records are **never physically deleted**:

- Student
- Enrollment
- Enrollment Payment
- Attendance Session
- Attendance Record
- Student Progress
- Student Certificate

These records form part of the permanent academic history.

The following configuration records should be deactivated instead of deleted:

- Program
- Sub Program
- Class
- Learning Material (soft delete via is_active)
- Learning Milestone (soft delete via is_active)
- Certificate
- Enrollment Period
- StaffAttendanceSession (soft delete via is_active)

The following may be hard-deleted:

- StaffAttendanceRecord (only while session is DRAFT)
- BranchTransferRequest

---

# 6. Unique Constraints

## Student

```
user
```

## Program

```
name
slug
```

## SubProgram

```
(program, name)
(program, slug)
```

## Class

No additional uniqueness constraint.

## Enrollment

```
(student, enrolled_class) — only one non-cancelled enrollment
```

## EnrollmentPeriod

Active periods must not overlap for the same (branch, program, sub_program, class_type). Enforced by service layer.

## EnrollmentPayment

```
enrollment
```

## AttendanceSession

```
(enrolled_class, session_date)
```

## AttendanceRecord

```
(attendance_session, enrollment)
```

## LearningMilestone

```
(sub_program, scope_class, title)
```

## StudentProgress

```
(enrollment, milestone)
```

## Certificate

```
sub_program
```

## StudentCertificate

```
certificate_number
(student, sub_program)
```

## StaffAttendanceRecord

```
(session, staff_member)
```

---

# 7. Global Index Strategy

## Student
- user, branch, is_active, date_joined

## Program
- slug, is_active

## SubProgram
- program, slug, is_active

## Class
- branch, sub_program, instructor, class_type, is_active

## Enrollment
- student, enrolled_class, status, enrolled_at, enrollment_number, pending_code

## EnrollmentPeriod
- branch, program, sub_program, class_type, is_active, start_date, end_date

## EnrollmentPayment
- enrollment, payment_method, status, payment_date, transaction_reference

## AttendanceSession
- enrolled_class, session_date, recorded_by

## AttendanceRecord
- attendance_session, enrollment, status

## LearningMilestone
- sub_program, is_active

## StudentProgress
- enrollment, milestone, status

## LearningMaterial
- sub_program, uploaded_by, material_type, is_active

## Certificate
- sub_program, is_active

## StudentCertificate
- student, certificate, sub_program, certificate_number

## StaffAttendanceSession
- branch, date, status, is_active

## StaffAttendanceRecord
- session, staff_member, status

## BranchTransferRequest
- enrollment, status, from_branch, to_branch

---

# 8. Staff Attendance

## Purpose

Tracks daily attendance for non-teaching staff (secretaries, managers, instructors).

## StaffAttendanceSession

A DRAFT session is created per branch per day. Once finalized, it is PUBLISHED.

### Fields

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| branch | ForeignKey | Branch |
| date | Date | Attendance date |
| status | Choice | DRAFT / PUBLISHED |
| notes | Text | Optional |
| created_by | ForeignKey | User who created |
| is_active | Boolean | Soft delete flag |
| created_at | DateTime | Audit |
| updated_at | DateTime | Audit |

## StaffAttendanceRecord

### Fields

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| session | ForeignKey(CASCADE) | Parent session |
| staff_member | ForeignKey | User |
| status | Choice | PRESENT / ABSENT / LATE / EXCUSED |
| notes | Text | Optional |
| created_at | DateTime | Audit |
| updated_at | DateTime | Audit |

## Status (Session)

```
DRAFT
PUBLISHED
```

## Rules

- Only DRAFT sessions can be modified.
- Publishing locks the session.
- Records are CASCADE-deleted with the session.

---

# 9. Branch Transfer Request

## Purpose

Manages requests to transfer an active enrollment from one branch to another.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| enrollment | ForeignKey(CASCADE) | Source enrollment |
| from_branch | ForeignKey | Current branch |
| to_branch | ForeignKey | Target branch |
| target_class | ForeignKey | Class in target branch |
| requested_by | ForeignKey | Who requested |
| approved_by | ForeignKey | Who approved (nullable) |
| status | Choice | PENDING / APPROVED / REJECTED |
| rejection_reason | Text | Reason if rejected |
| created_at | DateTime | Audit |
| approved_at | DateTime | Nullable |

## Status

```
PENDING
APPROVED
REJECTED
```

## Rules

- Enrollment must be active.
- Source and target branches must differ.
- Target class must belong to target branch.
- Target class must have capacity.
- No duplicate pending request for same enrollment.
- Approval cancels old enrollment and creates a new one in the target class.

---

# 10. Shared Enumerations

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

## Progress Status

```
NOT_STARTED
IN_PROGRESS
COMPLETED
```

## Material Type

```
PDF
PPT
PPTX
DOC
DOCX
IMAGE
ZIP
OTHER
```

## Duration Unit

```
DAY
WEEK
MONTH
```

## Session Status (Staff Attendance)

```
DRAFT
PUBLISHED
```

## Transfer Status

```
PENDING
APPROVED
REJECTED
```

---

**Status:** LOCKED
