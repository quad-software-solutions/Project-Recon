# Project Recon

# Academic Application Architecture Specification v1.0

**Status:** LOCKED

**Application:** `academic`

---

# 1. Purpose

The Academic application is responsible for managing the institute's complete academic lifecycle, beginning with student admission and ending with certificate issuance.

---

# 2. Responsibilities

The Academic application owns:

- Student Profiles
- Programs
- Sub Programs
- Classes
- Enrollments
- Enrollment Periods
- Enrollment Payments
- Attendance Sessions
- Attendance Records
- Learning Milestones
- Student Progress
- Learning Materials
- Certificate Templates
- Student Certificates
- Student Academic Reports
- Staff Attendance
- Branch Transfer Requests

---

# 3. Academic Hierarchy

```text
Program
  ↓
SubProgram
  ↓
Class
  ↓
Attendance Session
  ↓
Attendance Record

Enrollment
  ↓
Learning Progress
  ↓
Certificate
```

---

# 4. Student Lifecycle

## Admission (Staff-initiated)

```text
New Student
  ↓
Create User (via UserService)
  ↓
Create Student Profile
  ↓
Admission Completed
```

A Student Profile is created only during the student's first admission. Future studies create additional enrollments using the same Student Profile.

## Self-Service Enrollment (Student-initiated)

```text
New or Existing User
  ↓
Select Class
  ↓
Provide Details + Payment Info
  ↓
Enrollment Created (PENDING_VERIFICATION)
  ↓
Pending Code Generated
  ↓
Email Sent with Confirmation
```

Supports both new users (auto-create user + student) and existing users (reuse profile).

---

# 5. Enrollment Flow

## Standard Enrollment (Staff)

```text
Staff selects Student + Class
  ↓
Validates enrollment period (for GROUP)
  ↓
Validates class capacity
  ↓
Checks for duplicate enrollment
  ↓
Creates Enrollment (PENDING_VERIFICATION)
```

## Payment Verification

```text
Staff records payment
  ↓
Creates EnrollmentPayment (VERIFIED)
  ↓
Sets Enrollment status to ACTIVE
  ↓
Generates enrollment number (ENR-YYYY-NNNNNN)
  ↓
Email sent with enrollment details
```

## Payment Rejection

```text
Staff rejects payment
  ↓
Sets Enrollment status to REJECTED
  ↓
Sets Payment status to CANCELLED
  ↓
Email sent with rejection reason
```

## Under Review

```text
Staff sets enrollment to UNDER_REVIEW
  ↓
Verification status updated (SUBMITTED → UNDER_REVIEW)
```

## Cancel Enrollment

```text
Staff cancels enrollment
  ↓
Only allowed for PENDING_VERIFICATION or ACTIVE
  ↓
Sets status to CANCELLED
```

## Complete Enrollment

```text
Staff completes enrollment
  ↓
Only allowed for ACTIVE
  ↓
Sets status to COMPLETED
```

---

# 6. Enrollment Periods

Some Programs accept students only during specific registration periods. This applies primarily to Group Classes.

Enrollment periods are scoped by: Branch, Program, SubProgram, Class Type, Class Period.

Individual Classes remain open for enrollment at any time.

---

# 7. Payment Methods

Three payment methods are supported:

- CASH — Secretary records manually, automatically verified.
- BANK_TRANSFER — Requires bank name + transfer reference or attachment.
- TELEBIRR — Requires transaction reference or attachment.

Non-cash payments require verification by staff (PENDING_VERIFICATION → VERIFIED).

---

# 8. Academic Staff Roles

## Super Admin

Unrestricted access across all branches.

## Branch Manager

Scoped to managed branch. Can manage students, classes, enrollments, attendance, progress, materials, certificates, reports, payments, staff attendance, transfers.

## Secretary

Scoped to one branch. Can register students, create enrollments, record payments, generate reports, issue certificates. Cannot manage academic structure (Programs, SubPrograms).

## Instructor

Can view assigned classes, create attendance sessions, record attendance, update student progress, upload learning materials, manage own materials.

---

# 9. Attendance

Attendance is recorded per Class Session. Teachers create an Attendance Session for each class meeting, then mark students within that session.

---

# 10. Learning Progress

Every Sub Program defines its own learning milestones.

Each student's progress is tracked per Enrollment. Milestones can be shared (SubProgram-wide) or scoped to a specific Class.

Instructors can customize a shared milestone into a class-specific copy.

---

# 11. Learning Materials

Materials belong to a Sub Program. Access is controlled by enrollment status.

---

# 12. Certificates

Every Sub Program owns one Certificate template. Certificates are issued manually by authorized staff. Once issued, a Student Certificate is immutable.

---

# 13. Staff Attendance

Daily attendance tracking for non-teaching staff. Sessions are created per branch per day as DRAFT, then PUBLISHED to lock.

---

# 14. Branch Transfer

Active enrollments can be transferred between branches. Requires approval workflow: PENDING → APPROVED/REJECTED. Approval cancels old enrollment and creates a new one in the target class.

---

# 15. Enrollment Move

Enrollments can be moved to a different class within the same branch (same SubProgram).

Bulk move is supported — move multiple enrollments at once by IDs or count.

---

# 16. SubProgram Switch

An enrollment can be switched to a different SubProgram. The old enrollment is cancelled, a new one is created (linked via transferred_from), and attendance/progress records are repointed.

---

# 17. Academic Reports

Generated dynamically as PDF. Reports include student info, enrollments, attendance, progress, and certificates. Not stored in the database.

Available reports:

- Student Report (full academic history)
- Enrollment Report
- Attendance Report
- Progress Report
- Certificate Report
- Class Report
- SubProgram Report
- Program Report

---

# 18. Design Principles

- Match the institute's real business workflow.
- Keep the architecture simple.
- Use Django conventions wherever possible.
- Separate external integrations from academic logic.
- Generate reports dynamically instead of storing them.
- Treat certificates as permanent academic records.
- Keep student history complete and immutable.

---

**Status:** LOCKED
