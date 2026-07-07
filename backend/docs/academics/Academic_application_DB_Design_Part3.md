# Project Recon

# Academic Application Database Design
## Part 3 — Learning Resources & Academic Achievement

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document defines the database design for the learning resources and academic achievement models. It intentionally excludes services, APIs, permissions, and implementation.

---

# 1. Scope

This document covers:

- Learning Milestone
- Student Progress
- Learning Material
- Certificate
- Student Certificate

---

# 2. Entity Relationship Overview

```text
                    SubProgram
                         │
     ┌───────────────────┼────────────────────┐
     │                   │                    │
     ▼                   ▼                    ▼
Learning Milestone   Learning Material   Certificate
     │                                         │
     ▼                                         ▼
Student Progress                      Student Certificate
     ▲
     │
 Enrollment
```

---

# 3. Learning Milestone

## Purpose

Learning Milestones define the curriculum of a Sub Program.

Every Sub Program owns its own independent set of milestones.

The Academic system does **not** enforce a fixed curriculum.

Each program may define milestones that best match its learning objectives.

---

## Examples

### Python

- Variables
- Data Types
- Loops
- Functions
- Object-Oriented Programming
- File Handling
- Django Basics

### English

- Alphabet
- Vocabulary
- Grammar
- Reading
- Conversation
- Writing

### Arduino

- Introduction
- LEDs
- Buttons
- Sensors
- Motors
- Final Project

---

## Relationships

```text
SubProgram

1

↓

∞

Learning Milestone
```

```text
Learning Milestone

1

↓

∞

Student Progress
```

---

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Parent Sub Program |
| title | String | Yes | Milestone title |
| description | Text | No | Optional explanation |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Constraints

- Every milestone belongs to one Sub Program.
- Milestone titles must be unique within a Sub Program.

---

## Indexes

- sub_program

Composite

```
(sub_program, title)
```

---

## Delete Policy

Milestones should never be physically deleted after students begin using them.

Deactivate if necessary.

---

# 4. Student Progress

## Purpose

Student Progress records a student's learning progress for a specific **Enrollment**.

Progress belongs to an Enrollment rather than directly to the Student.

This allows a student to repeat the same Sub Program in the future while preserving the complete learning history of every enrollment independently.

---

## Relationships

```text
Enrollment

1

↓

∞

Student Progress
```

```text
Learning Milestone

1

↓

∞

Student Progress
```

---

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| enrollment | ForeignKey | Yes | Student Enrollment |
| milestone | ForeignKey | Yes | Learning Milestone |
| status | Choice | Yes | Current learning state |
| completed_at | DateTime | No | Completion timestamp |
| remarks | Text | No | Instructor remarks |
| updated_by | ForeignKey | Yes | Instructor |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Progress Status

```text
NOT_STARTED

IN_PROGRESS

COMPLETED
```

---

## Constraints

- Every Student Progress belongs to one Enrollment.
- Every Student Progress belongs to one Learning Milestone.
- The Learning Milestone must belong to the same Sub Program as the Enrollment's Class.
- Only one Student Progress may exist for the same `(Enrollment, Learning Milestone)` combination.
- Only the assigned Instructor (or authorized academic staff) may update progress.

---

## Indexes

- enrollment
- milestone
- status

Composite

```
(enrollment, milestone)
```

---

## Delete Policy

Student Progress is a permanent academic record.

Progress records should never be deleted.

---

# 5. Learning Material

## Purpose

Learning Materials are educational resources attached directly to a Sub Program.

Students enrolled in the Sub Program gain access to these resources.

Academic staff may view all learning materials.

---

## Relationships

```text
SubProgram

1

↓

∞

Learning Material
```

```text
User (Instructor)

1

↓

∞

Learning Material
```

---

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Parent Sub Program |
| title | String | Yes | Display title |
| description | Text | No | Optional |
| file | FileField | Yes | Uploaded resource |
| material_type | Choice | Yes | File type |
| uploaded_by | ForeignKey | Yes | Owner |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Supported Types

```text
PDF

PPT

PPTX

DOC

DOCX

IMAGE


OTHER
```

---

## Constraints

- Every material belongs to one Sub Program.
- Every material has one owner.
- Only the uploading Instructor may modify or remove their own materials.

---

## Indexes

- sub_program
- uploaded_by
- material_type
- is_active

---

## Delete Policy

Learning Materials should be deactivated instead of deleted.

---

# 6. Certificate

## Purpose

Certificate represents the official certificate template for a Sub Program.

Each Sub Program owns exactly one certificate template.

Updating the template affects only future certificates.

Previously issued certificates remain unchanged.

---

## Relationships

```text
SubProgram

1

↓

1

Certificate
```

```text
Certificate

1

↓

∞

Student Certificate
```

---

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | OneToOne | Yes | Owner |
| title | String | Yes | Certificate title |
| background | ImageField | Yes | Background template |
| institute_logo | ImageField | No | Optional |
| signature | ImageField | No | Optional |
| body_text | Text | Yes | Certificate wording |
| is_active | Boolean | Yes | Active template |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Constraints

- One Certificate per Sub Program.
- Certificate title is required.

---

## Indexes

- sub_program
- is_active

---

## Delete Policy

Certificate templates cannot be deleted after issuance.

Deactivate instead.

---

# 7. Student Certificate

## Purpose

Represents an officially issued certificate.

An issued certificate is immutable and becomes a permanent academic record.

The generated PDF is the official certificate retained by the institute.

---

## Relationships

```text
Student

1

↓

∞

Student Certificate
```

```text
Certificate

1

↓

∞

Student Certificate
```

```text
SubProgram

1

↓

∞

Student Certificate
```

---

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| student | ForeignKey | Yes | Certificate owner |
| certificate | ForeignKey | Yes | Certificate template used |
| sub_program | ForeignKey | Yes | Completed Sub Program |
| certificate_number | String | Yes | Unique number |
| pdf | FileField | Yes | Official generated PDF |
| issued_by | ForeignKey | Yes | Admin / Manager / Secretary |
| issued_at | DateTime | Yes | Issue timestamp |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

---

## Why store both Certificate and SubProgram?

Although the Certificate already belongs to a Sub Program, both relationships are intentionally stored.

This preserves:

- Which academic program the certificate was issued for.
- Which certificate template generated the document.

If the certificate template is redesigned later, previously issued certificates remain linked to the original template used during issuance.

This guarantees complete historical accuracy.

---

## Constraints

- Certificate Number must be unique.
- One Student Certificate per Student and Sub Program.
- Issued certificates are immutable.
- The stored PDF is the institute's official copy.

---

## Indexes

- student
- certificate
- sub_program
- certificate_number

Composite

```
(student, sub_program)
```

---

## Delete Policy

Student Certificates are permanent academic records.

They must never be deleted.

---

# 8. Shared Enumerations

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

OTHER
```

---

# 9. Locked Decisions

- Every Sub Program defines its own Learning Milestones.
- Student Progress belongs to an Enrollment, not directly to a Student.
- Students may repeat the same Sub Program without losing historical progress.
- Learning Materials belong directly to a Sub Program.
- Students only access materials for enrolled Sub Programs.
- Academic staff may view all learning materials.
- Every Sub Program owns exactly one Certificate template.
- Updating a Certificate template affects only future certificates.
- Every Student Certificate stores both the Sub Program and the Certificate template used to generate it.
- Issued certificates are immutable permanent academic records.
- The generated PDF is the official institute copy.
- One Student may receive only one certificate for a specific Sub Program.

---

# Status

**🔒 LOCKED**
