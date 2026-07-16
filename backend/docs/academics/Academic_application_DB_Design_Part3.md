# Project Recon

# Academic Application Database Design
## Part 3 — Learning Resources & Academic Achievement

**Status:** LOCKED

**Application:** `academic`

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
     │                                        │
     ▼                                        ▼
Student Progress                     Student Certificate
     ▲
     │
 Enrollment

     Class (scope_class, nullable)
       │
       ▼
Learning Milestone (class-scoped)
```

---

# 3. Learning Milestone

## Purpose

Learning Milestones define the curriculum of a Sub Program.

Every Sub Program owns its own independent set of milestones. Milestones can be shared (all classes in a SubProgram) or scoped to a specific Class.

---

## Scope

Milestones support two scopes:

- **Shared** — visible to all classes within the SubProgram (`scope_class` is null).
- **Class-specific** — owned by a specific Class (`scope_class` is set).

Instructors can customize a shared milestone into a class-specific copy.

---

## Relationships

```
SubProgram (1) → (∞) LearningMilestone
Class (0..1) → (∞) LearningMilestone (scope_class, nullable)
LearningMilestone (1) → (∞) StudentProgress
```

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Parent Sub Program |
| scope_class | ForeignKey | No | Null = shared, set = class-scoped |
| title | String | Yes | Milestone title |
| description | Text | No | Optional explanation |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Constraints

- Every milestone belongs to one Sub Program.
- Milestone titles must be unique within a Sub Program + scope_class combination.

## Delete Policy

Milestones should not be deleted after students begin using them. Archive instead (set is_active=False).

---

# 4. Student Progress

## Purpose

Student Progress records a student's learning progress for a specific **Enrollment**.

Progress belongs to an Enrollment rather than directly to the Student. This preserves history when a student repeats the same Sub Program.

## Relationships

```
Enrollment (1) → (∞) StudentProgress
LearningMilestone (1) → (∞) StudentProgress
StudentProgress (1) → (1) User (updated_by)
```

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

## Progress Status

```
NOT_STARTED
IN_PROGRESS
COMPLETED
```

## Constraints

- One progress record per Enrollment + Milestone combination.
- The milestone must belong to the same SubProgram as the Enrollment's Class.
- Only the assigned Instructor (or authorized staff) may update progress.

## Delete Policy

Student Progress is a permanent academic record. Never deleted.

---

# 5. Learning Material

## Purpose

Learning Materials are educational resources attached directly to a Sub Program.

## Relationships

```
SubProgram (1) → (∞) LearningMaterial
User (uploaded_by) (1) → (∞) LearningMaterial
```

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| sub_program | ForeignKey | Yes | Parent Sub Program |
| title | String | Yes | Display title |
| description | Text | No | Optional |
| file | FileField | Yes | Uploaded resource |
| material_type | Choice | Yes | Detected from extension, not user-editable |
| uploaded_by | ForeignKey | Yes | Owner |
| is_active | Boolean | Yes | Visibility |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Supported Types

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

Material type is detected automatically from the file extension on upload.

## Constraints

- Every material belongs to one Sub Program.
- Every material has one owner.
- File is validated by the shared file validator (rejects executables, scripts, files >10MB).
- Images are re-encoded to a standard format on upload.

## Delete Policy

Learning Materials are soft-deleted (is_active=False).

---

# 6. Certificate

## Purpose

Certificate represents the official certificate template for a Sub Program. Each Sub Program owns exactly one certificate template.

## Relationships

```
SubProgram (1) → (1) Certificate
Certificate (1) → (∞) StudentCertificate
```

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

## Constraints

- One Certificate per Sub Program.
- Certificate title is required.
- Background image is validated by shared file validator.

## Delete Policy

Certificate templates cannot be deleted after issuance. Deactivate instead.

---

# 7. Student Certificate

## Purpose

Represents an officially issued certificate. Once issued, it is immutable and becomes a permanent academic record.

## Relationships

```
Student (1) → (∞) StudentCertificate
Certificate (1) → (∞) StudentCertificate
SubProgram (1) → (∞) StudentCertificate
User (issued_by) (1) → (∞) StudentCertificate
```

## Database Fields

| Field | Type | Required | Notes |
|--------|------|----------|------|
| id | UUID | Yes | Primary Key |
| student | ForeignKey | Yes | Certificate owner |
| certificate | ForeignKey | Yes | Certificate template used |
| sub_program | ForeignKey | Yes | Completed Sub Program |
| certificate_number | String | Yes | Unique, auto-generated |
| issued_by | ForeignKey | Yes | Admin / Manager / Secretary |
| issued_at | DateTime | Yes | Issue timestamp |
| created_at | DateTime | Yes | Audit |
| updated_at | DateTime | Yes | Audit |

## Why store both Certificate and SubProgram?

Both are stored to preserve historical accuracy. If the certificate template is redesigned later, previously issued certificates remain linked to the original template used during issuance.

## Constraints

- Certificate Number must be unique.
- One certificate per Student + SubProgram combination.
- Issued certificates are immutable.

## Delete Policy

Student Certificates are permanent academic records. Never deleted.

---

# 8. Shared Enumerations

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

---

# 9. Locked Decisions

- Every Sub Program defines its own Learning Milestones.
- Milestones support two scopes: shared (SubProgram-wide) and class-specific.
- Student Progress belongs to an Enrollment, not directly to a Student.
- Students may repeat the same Sub Program without losing historical progress.
- Learning Materials belong to a Sub Program.
- Material type is detected automatically from the file extension.
- Every Sub Program owns exactly one Certificate template.
- Updating a Certificate template affects only future certificates.
- Every Student Certificate stores both the Sub Program and the Certificate template.
- Issued certificates are immutable.
- One Student may receive only one certificate per Sub Program.

---

**Status:** LOCKED
