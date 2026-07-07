# Project Recon

# Academic Application Database Design
## Part 4 — Global Database Rules & Final Specification

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document finalizes the Academic application's database design by defining global database rules, relationship policies, indexing strategy, foreign key behaviors, enumerations, and the complete entity relationship architecture.

---

# 1. Scope

This document finalizes the database design by defining:

- Complete Relationship Matrix
- Foreign Key Behaviors
- Delete Policies
- Cascade Rules
- Database Constraints
- Global Index Strategy
- Shared Enumerations
- Final Entity Relationship Diagram

---

# 2. Complete Entity Relationship Diagram

```text
                                User
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
                  ▼                             ▼
              Student                     Instructor
                  │
                  │
                  ▼
              Enrollment
           ┌─────┴──────────────────┐
           │                        │
           ▼                        ▼
  Attendance Record        Enrollment Payment
           ▲
           │
  Attendance Session
           ▲
           │
           Class
                                   
           Student Progress
           ▲
           │
  Learning Milestone
           ▲
           │
       Sub Program
     ┌────┼───────────────┬───────────────┐
     │                    │               │
     ▼                    ▼               ▼
  Program          Learning Material   Certificate
                                             │
                                             ▼
                                   Student Certificate

Branch
 │
 ├──────────────► Student
 ├──────────────► Class
 └──────────────► Enrollment Period

Program
 │
 ├──────────────► Sub Program
 └──────────────► Enrollment Period

Sub Program
 │
 ├──────────────► Class
 ├──────────────► Learning Material
 ├──────────────► Learning Milestone
 ├──────────────► Certificate
 ├──────────────► Enrollment Period
 └──────────────► Student Certificate
```

---

# 3. Relationship Matrix

| Parent | Child | Relationship |
|---------|-------|-------------|
| User | Student | One to One |
| Branch | Student | One to Many |
| Program | Sub Program | One to Many |
| Sub Program | Class | One to Many |
| Branch | Class | One to Many |
| Instructor | Class | One to Many |
| Student | Enrollment | One to Many |
| Class | Enrollment | One to Many |
| Enrollment | Enrollment Payment | One to One |
| Enrollment | Attendance Record | One to Many |
| Class | Attendance Session | One to Many |
| Attendance Session | Attendance Record | One to Many |
| Enrollment | Student Progress | One to Many |
| Sub Program | Learning Milestone | One to Many |
| Learning Milestone | Student Progress | One to Many |
| Sub Program | Learning Material | One to Many |
| Instructor | Learning Material | One to Many |
| Sub Program | Certificate | One to One |
| Certificate | Student Certificate | One to Many |
| Student | Student Certificate | One to Many |
| Branch | Enrollment Period | One to Many |
| Program | Enrollment Period | One to Many |
| Sub Program | Enrollment Period | One to Many |

---

# 4. Foreign Key Behaviors

## Student

| Parent | On Delete |
|---------|-----------|
| User | PROTECT |
| Branch | PROTECT |

---

## Program

No parent relationships.

---

## Sub Program

| Parent | On Delete |
|---------|-----------|
| Program | PROTECT |

---

## Class

| Parent | On Delete |
|---------|-----------|
| Branch | PROTECT |
| Sub Program | PROTECT |
| Instructor | PROTECT |

---

## Enrollment

| Parent | On Delete |
|---------|-----------|
| Student | PROTECT |
| Class | PROTECT |

---

## Enrollment Period

| Parent | On Delete |
|---------|-----------|
| Branch | PROTECT |
| Program | PROTECT |
| Sub Program | PROTECT |

---

## Enrollment Payment

| Parent | On Delete |
|---------|-----------|
| Enrollment | PROTECT |

---

## Attendance Session

| Parent | On Delete |
|---------|-----------|
| Class | PROTECT |
| Recorded By | PROTECT |

---

## Attendance Record

| Parent | On Delete |
|---------|-----------|
| Attendance Session | PROTECT |
| Enrollment | PROTECT |

---

## Learning Milestone

| Parent | On Delete |
|---------|-----------|
| Sub Program | PROTECT |

---

## Student Progress

| Parent | On Delete |
|---------|-----------|
| Enrollment | PROTECT |
| Learning Milestone | PROTECT |
| Updated By | PROTECT |

---

## Learning Material

| Parent | On Delete |
|---------|-----------|
| Sub Program | PROTECT |
| Uploaded By | PROTECT |

---

## Certificate

| Parent | On Delete |
|---------|-----------|
| Sub Program | PROTECT |

---

## Student Certificate

| Parent | On Delete |
|---------|-----------|
| Student | PROTECT |
| Certificate | PROTECT |
| Sub Program | PROTECT |
| Issued By | PROTECT |

---

# 5. Delete Policy

The Academic application preserves historical academic records.

The following records are **never physically deleted**:

- Student
- Enrollment
- Enrollment Payment
- Attendance Session
- Attendance Record
- Student Progress
- Student Certificate

These records form part of the permanent academic history.

---

The following configuration records should be deactivated instead of deleted:

- Program
- Sub Program
- Class
- Learning Material
- Certificate
- Enrollment Period

---

# 6. Unique Constraints

## Student

```text
user
```

```text
student_number
```

---

## Program

```text
name
```

```text
slug
```

---

## Sub Program

```text
(program, name)
```

```text
(program, slug)
```

---

## Class

No additional uniqueness constraint.

---

## Enrollment

```text
(student, class)
```

Only one enrollment per student for a specific class.

---

## Enrollment Period

Active periods must not overlap for the same:

```text
(branch,
program,
sub_program,
class_type)
```

This rule is enforced by the service layer.

---

## Enrollment Payment

```text
enrollment
```

One payment per enrollment.

---

## Attendance Session

```text
(class,
session_date)
```

One session per class per day.

---

## Attendance Record

```text
(attendance_session,
enrollment)
```

One record per enrollment per session.

---

## Learning Milestone

```text
(sub_program,
title)
```

---

## Student Progress

```text
(enrollment,
milestone)
```

---

## Certificate

```text
sub_program
```

---

## Student Certificate

```text
certificate_number
```

```text
(student,
sub_program)
```

---

# 7. Global Index Strategy

## Student

- student_number
- user
- branch

---

## Program

- slug
- is_active

---

## Sub Program

- program
- slug
- is_active

---

## Class

- branch
- sub_program
- instructor
- class_type
- is_active

---

## Enrollment

- student
- class
- status
- enrolled_at

---

## Enrollment Period

- branch
- program
- sub_program
- class_type
- is_active
- start_date
- end_date

---

## Enrollment Payment

- enrollment
- payment_method
- payment_provider
- status

---

## Attendance Session

- class
- session_date

---

## Attendance Record

- attendance_session
- enrollment
- status

---

## Learning Milestone

- sub_program

---

## Student Progress

- enrollment
- milestone
- status

---

## Learning Material

- sub_program
- uploaded_by
- is_active

---

## Certificate

- sub_program

---

## Student Certificate

- student
- sub_program
- certificate_number

---

# 8. Shared Enumerations

## Class Type

```text
GROUP

INDIVIDUAL
```

---

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

Future providers may be added without changing the Academic schema.

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

## Progress Status

```text
NOT_STARTED

IN_PROGRESS

COMPLETED
```

---

## Material Type

```text
PDF

PPT

PPTX

DOC

DOCX

IMAGE

ZIP

OTHER
```

---

## Duration Unit

```text
DAY

WEEK

MONTH
```

---

# 9. Global Database Rules

## Student

A Student profile can only be created through the Admission workflow.

Student profiles are never duplicated.

---

## Enrollment

Every Enrollment belongs to exactly one Student and one Class.

Every Enrollment owns exactly one Enrollment Payment.

Students may have unlimited Enrollments throughout their academic history.

---

## Enrollment Period

Enrollment Periods are scoped by:

- Branch
- Program
- Sub Program
- Class Type

Only Group classes require an active Enrollment Period.

---

## Attendance Session

Attendance Sessions represent one teaching session for a Class.

Sessions are created once per class meeting.

---

## Attendance Record

Attendance Records represent one student's attendance for a specific Attendance Session.

Attendance Records belong to an Attendance Session and reference the student's Enrollment.

Attendance Records are permanent.

---

## Student Progress

Progress belongs to an Enrollment.

Repeating the same Sub Program creates a new progress history.

---

## Learning Materials

Materials belong directly to Sub Programs.

Students only access materials for enrolled Sub Programs.

Academic staff may view all materials.

---

## Certificates

Each Sub Program owns one Certificate template.

Issued Student Certificates store both:

- Certificate template
- Sub Program

This preserves historical accuracy even if templates change.

---

## Reports

Student Reports are generated dynamically.

Reports are **never stored** in the database.

---

# 10. Performance Strategy

The Academic database is optimized for:

- Student lookup
- Enrollment lookup
- Class roster generation
- Attendance session creation and recording
- Certificate generation
- Academic report generation
- Material retrieval

Indexes are designed around these common operations.

---

# 11. Final Locked Decisions

The following architectural decisions are finalized:

- UUID primary keys are used for all models.
- Historical academic records are immutable.
- Soft deactivation is preferred over physical deletion for configurable data.
- Enrollment is the central entity of the Academic domain.
- Student Progress belongs to Enrollment rather than Student.
- Enrollment Payment is owned by Enrollment.
- Learning Materials belong directly to Sub Programs.
- Certificate templates and issued certificates are separate entities.
- Issued certificates are immutable and permanently retained.
- Reports are generated dynamically rather than stored.
- External integrations (payment providers, email, storage, etc.) remain outside the Academic application.

---

# Status

**🔒 LOCKED**
