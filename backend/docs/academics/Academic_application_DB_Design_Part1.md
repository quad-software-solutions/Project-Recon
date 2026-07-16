# Project Recon

# Academic Application Database Design
## Part 1 — Academic Foundation

**Status:** LOCKED

**Application:** `academic`

---

# 1. Scope

This document covers the following models:

- Student
- Program
- SubProgram
- Class

---

# 2. Entity Relationship Overview

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
 ├──────────────┐
 │              │
 ▼              ▼
Class      LearningMaterial
 │
 ▼
Enrollment
```

---

# 3. Student

## Purpose

Represents the academic profile of a user.

The Student model stores academic information only.

Authentication remains in the Accounts application.

---

## Ownership

Owned by: Academic App

---

## Relationships

```
User (1) → (1) Student
Student (1) → (∞) Enrollment
Branch (1) → (∞) Student
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| user | OneToOne | Yes | Accounts.User |
| branch | ForeignKey | Yes | Current home branch |
| date_joined | Date | Yes | Admission date |
| guardian_name | String | No | Optional guardian info |
| guardian_phone | String | No | Optional guardian phone |
| guardian_email | Email | No | Optional guardian email |
| is_active | Boolean | Yes | Academic status |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Indexes

- user
- branch
- is_active
- date_joined

## Constraints

- One User → One Student

## Delete Policy

Student records are never physically deleted. Only deactivated.

---

# 4. Program

## Purpose

Represents the highest academic category.

Examples: Robotics, Programming, Languages

---

## Relationships

```
Program (1) → (∞) SubProgram
Program (1) → (∞) EnrollmentPeriod
```

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

## Constraints

- Program names must be unique.
- Slug must be unique.
- At least one learning type must be enabled (validated in `clean()`).

## Delete Policy

Programs cannot be deleted once referenced. Deactivate instead.

---

# 5. SubProgram

## Purpose

Represents an individual subject inside a Program. Students ultimately study SubPrograms.

---

## Relationships

```
Program (1) → (∞) SubProgram
SubProgram (1) → (∞) Class
SubProgram (1) → (∞) LearningMaterial
SubProgram (1) → (∞) LearningMilestone
SubProgram (1) → (∞) EnrollmentPeriod
SubProgram (1) → (1) Certificate
SubProgram (1) → (∞) StudentCertificate
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| program | ForeignKey | Yes | Parent Program |
| name | String | Yes | Subject name |
| slug | String | Yes | URL friendly |
| description | Text | No | Optional |
| duration | PositiveInteger | No | Optional duration value |
| duration_unit | Choice | No | Day / Week / Month |
| group_fee | Decimal | Yes | Fee for group enrollment |
| individual_fee | Decimal | No | Fee for individual enrollment |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Duration Units

```
DAY
WEEK
MONTH
```

## Constraints

- Program + Name must be unique.
- Program + Slug must be unique.
- Fees cannot be negative.

## Delete Policy

Cannot be deleted after enrollment exists. Deactivate instead.

---

# 6. Class

## Purpose

Represents an actual teaching class. Students enroll into Classes. Classes belong to one SubProgram.

## Supported Types

```
GROUP
INDIVIDUAL
```

## Supported Periods

```
FULL_DAY
HALF_DAY
```

## Relationships

```
SubProgram (1) → (∞) Class
Branch (1) → (∞) Class
Instructor(User) (1) → (∞) Class
Class (1) → (∞) Enrollment
Class (1) → (∞) AttendanceSession
Class (1) → (∞) LearningMilestone (scope_class, nullable)
```

## Database Fields

| Field | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Academic subject |
| branch | ForeignKey | Yes | Teaching branch |
| instructor | ForeignKey | Yes | Accounts.User |
| name | String | Yes | Human-readable class name |
| class_type | Choice | Yes | Group / Individual |
| class_period | Choice | No | Half Day / Full Day |
| capacity | PositiveInteger | No | Required for Group |
| start_date | Date | No | Optional |
| end_date | Date | No | Optional |
| is_active | Boolean | Yes | Active class |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Capacity Rules

GROUP — Capacity must be greater than zero.

INDIVIDUAL — Capacity is always one (enforced by service layer).

## Constraints

- Class must belong to one Branch.
- Class must belong to one SubProgram.
- Instructor must be a Teacher.
- Individual Classes always have capacity of one.
- Group Classes require positive capacity.

## Delete Policy

Classes with enrollments cannot be deleted. Deactivate instead.

---

# 7. Shared Enumerations

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

## Duration Unit

```
DAY
WEEK
MONTH
```

---

# 8. Locked Decisions

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

---

**Status:** LOCKED
