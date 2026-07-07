# Project Recon

# Academic Application Database Design
## Part 1 — Academic Foundation

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document defines the database design for the foundational academic models. It intentionally excludes services, APIs, serializers, permissions, and implementation details.

---

# 1. Scope

This document covers the following models:

- Student
- Program
- SubProgram
- Class

Future parts will cover:

- Enrollment
- Enrollment Period
- Enrollment Payment
- Attendance Session
- Attendance Record
- Learning Progress
- Learning Materials
- Certificates

---

# 2. Database Design Principles

The Academic database follows these principles.

## Simplicity

The schema should model the institute's workflow without unnecessary abstraction.

---

## Normalization

Duplicate data should be avoided whenever practical.

---

## Business First

The schema reflects how the institute currently operates rather than forcing generic LMS concepts.

---

## Django Conventions

Whenever Django already provides a clean solution, it should be used instead of custom implementations.

---

## Future Expandability

Future features must be added without redesigning existing models.

---

# 3. Entity Relationship Overview

```text
Program
    │
    │ 1
    │
    ▼
SubProgram
    │
    ├──────────────┐
    │              │
    ▼              ▼
Class      LearningMaterial
    │
    ▼
Enrollment
```

---

# 4. Student

## Purpose

Represents the academic profile of a user.

The Student model stores academic information only.

Authentication remains in the Accounts application.

---

## Ownership

Owned by:

Academic App

---

## Relationships

```text
User

1

↓

1

Student
```

Student

```text
1

↓

∞

Enrollment
```

Student

```text
1

↓

∞

Student Progress
```

Student

```text
1

↓

∞

Student Certificate
```

---

## Important Notes

A Student is created only once.

The Student remains throughout the learner's academic lifetime.

Future enrollments reuse the same Student profile.

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| user | OneToOne | Yes | Accounts.User |
| branch | ForeignKey | Yes | Current home branch |
| date_joined | Date | Yes | Admission date |
| is_active | Boolean | Yes | Academic status |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Indexes

- user
- branch
- is_active

---

## Constraints

- One User → One Student

---

## Delete Policy

Student records are never physically deleted.

Only deactivated.

---

# 5. Program

## Purpose

Represents the highest academic category.

Examples

- Robotics
- Programming
- Languages

---

## Relationships

Program

```text
1

↓

∞

SubProgram
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| name | String | Yes | Unique |
| slug | String | Yes | URL friendly |
| description | Text | No | Optional |
| supports_group | Boolean | Yes | Business rule |
| supports_individual | Boolean | Yes | Business rule |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Constraints

Program names must be unique.

Slug must be unique.

At least one learning type must be enabled.

---

## Delete Policy

Programs cannot be deleted once referenced.

Deactivate instead.

---

# 6. SubProgram

## Purpose

Represents an individual subject inside a Program.

Students ultimately study SubPrograms.

---

## Relationships

Program

```text
1

↓

∞

SubProgram
```

SubProgram

```text
1

↓

∞

Class
```

SubProgram

```text
1

↓

∞

Learning Material
```

SubProgram

```text
1

↓

∞

Learning Milestone
```

SubProgram

```text
1

↓

1

Certificate
```

SubProgram

```text
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
| program | ForeignKey | Yes | Parent Program |
| name | String | Yes | Subject name |
| slug | String | Yes | URL friendly |
| description | Text | No | Optional |
| duration | PositiveInteger | No | Optional duration value |
| duration_unit | Choice | No | Days / Weeks / Months |
| fee | Decimal | Yes | One-time enrollment fee |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Duration Units

```text
DAY

WEEK

MONTH
```

---

## Constraints

Program + Name must be unique.

Program + Slug must be unique.

Fee cannot be negative.

---

## Delete Policy

Cannot be deleted after enrollment exists.

Deactivate instead.

---

# 7. Class

## Purpose

Represents an actual teaching class.

Students enroll into Classes.

Classes belong to one SubProgram.

---

## Supported Types

```text
GROUP

INDIVIDUAL
```

---

## Relationships

SubProgram

```text
1

↓

∞

Class
```

Branch

```text
1

↓

∞

Class
```

Instructor(User)

```text
1

↓

∞

Class
```

Class

```text
1

↓

∞

Enrollment
```

---

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Academic subject |
| branch | ForeignKey | Yes | Teaching branch |
| instructor | ForeignKey | Yes | Accounts.User |
| name | String | Yes | Human-readable class name |
| class_type | Choice | Yes | Group / Individual |
| capacity | PositiveInteger | No | Required for Group |
| start_date | Date | No | Optional |
| end_date | Date | No | Optional |
| is_active | Boolean | Yes | Active class |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Capacity Rules

GROUP

Capacity must be greater than zero.

---

INDIVIDUAL

Capacity is always one.

---

## Constraints

- Class must belong to one Branch.
- Class must belong to one SubProgram.
- Instructor must be a Teacher.
- Individual Classes always have capacity of one.
- Group Classes require positive capacity.
- Class type must be supported by the parent Program.

---

## Delete Policy

Classes with enrollments cannot be deleted.

Deactivate instead.

---

# 8. Shared Enumerations

## Class Type

```text
GROUP

INDIVIDUAL
```

---

## Duration Unit

```text
DAY

WEEK

MONTH
```

---

# 9. Summary Relationships

```text
User
 │
 │ 1
 ▼
Student
 │
 │ 1
 ▼
Enrollment


Program
 │
 │ 1
 ▼
SubProgram
 │
 ├───────────────┐
 │               │
 ▼               ▼
Class      LearningMaterial
 │
 ▼
Enrollment
```

---

# 10. Locked Decisions

The following decisions are finalized.

- Student is permanently linked to one User.
- Student profiles are never duplicated.
- Programs define supported learning types.
- SubPrograms are the primary academic subjects.
- Students enroll in Classes, never directly into Programs.
- Classes belong to one Branch.
- Classes belong to one SubProgram.
- Classes support both Group and Individual learning.
- Individual Classes always have capacity of one.
- Programs, SubPrograms, Students, and Classes use soft deletion through deactivation.
- Future academic modules (Attendance Sessions, Attendance Records, Progress, Materials, Certificates) attach to existing models without redesign.

---

# Status

**🔒 LOCKED**

