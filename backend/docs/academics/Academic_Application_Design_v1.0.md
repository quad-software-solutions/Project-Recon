# Project Recon

# Academic Application Architecture Specification v1.0

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document defines the overall architecture of the Academic application for Project Recon. It focuses only on business architecture and workflows. 

---

# Document Scope

This document covers:

- Application responsibilities
- Business workflow
- Domain architecture
- Academic hierarchy
- User responsibilities
- Student lifecycle
- Enrollment workflow
- Academic workflow
- Future architecture

This document does **NOT** cover:

- Database Design
- Model Specifications
- Service Layer
- API Design
- Permissions Implementation
- Validation Rules
- Django Implementation

Those are separate phases.

---

# 1. Purpose

The Academic application is responsible for managing the institute's complete academic lifecycle, beginning with student admission and ending with certificate issuance.

The system is designed around the institute's existing workflow while remaining flexible enough for future growth.

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
- Learning Progress
- Learning Materials
- Certificates
- Student Certificates
- Student Academic Reports

---

# 3. Responsibilities Outside Academic

The Academic application does **not** manage:

- Authentication
- Users
- Roles
- Branches
- Website Content
- News
- FAQ
- Contact Messages
- Audit Logs
- Payment Provider Integrations
- Email
- SMS
- Celery
- External Storage

Those belong to other applications or the configuration layer.

---

# 4. Overall Academic Architecture

```text
Academic

├── Student
├── Program
├── Sub Program
├── Class
├── Enrollment
├── Enrollment Period
├── Enrollment Payment
├── Attendance Session
├── Attendance Record
├── Learning Milestone
├── Student Progress
├── Learning Material
├── Certificate
├── Student Certificate
└── Student Report (Generated)
```

---

# 5. Academic Hierarchy

The academic structure follows the institute's teaching model.

```text
Program

↓

Sub Program

↓

Class

↓

Attendance Session

↓

Attendance Record

↓

Enrollment

↓

Learning Progress

↓

Certificate
```

---

# 6. Programs

Programs represent the highest academic category.

Examples

- Robotics
- Programming
- Languages
- Mathematics

Programs organize related Sub Programs.

---

# 7. Sub Programs

Sub Programs represent the actual subject students study.

Examples

Programming

- Python
- Scratch
- AI
- Web Development

Languages

- English
- French
- Arabic

Robotics

- Arduino
- LEGO Robotics
- EV3

Students enroll in Sub Programs through Classes.

---

# 8. Class Types

Every Class belongs to one Sub Program.

Two learning types are supported.

## Group

One instructor teaches multiple students.

## Individual

One instructor teaches one student.

---

# 9. Program Learning Rules

Different Programs support different learning methods.

Example

Robotics

- Group ✔
- Individual ✘

Programming

- Group ✔
- Individual ✔

Languages

- Group ✔
- Individual ✔

Future Programs may define their supported learning types.

---

# 10. Student Lifecycle

A Student Profile cannot exist independently.

A Student Profile is created only during the student's first admission.

Workflow

```text
New Student

↓

Create User

↓

Create Student Profile

↓

Create First Enrollment

↓

Create Enrollment Payment

↓

Admission Completed
```

This guarantees that every student has an academic record from the moment they are created.

---

# 11. Returning Students

A student profile is created only once.

Future studies create additional enrollments.

Example

```text
Student

↓

Python

Completed

↓

English

New Enrollment

↓

Robotics

New Enrollment
```

The Student Profile remains the same throughout the student's academic history.

---

# 12. Admission

Student admission is the complete registration process.

Admission includes:

- User creation
- Student profile creation
- Initial enrollment
- Initial payment

Admission is treated as one complete business operation.

---

# 13. Enrollment

Enrollment connects a Student to a Class.

Students may have multiple enrollments.

Example

```text
Student

├── Python

├── English

├── Robotics
```

Each enrollment is independent.

---

# 14. Enrollment Status

Every enrollment progresses through its own lifecycle.

```text
Pending Payment

↓

Active

↓

Completed

↓

Cancelled
```

---

# 15. Enrollment Periods

Some Programs accept students only during specific registration periods.

This applies primarily to Group Classes.

Individual Classes remain open for enrollment at any time.

---

# 16. Enrollment Period Scope

Enrollment periods belong to:

- Branch
- Program
- Sub Program
- Class Type

This allows different branches and different programs to operate independent admission periods.

---

# 17. Enrollment Period Example

```text
Main Branch

Programming

Python

Group

Aug 1 — Aug 20
```

Another

```text
Adama Branch

English

Group

Sep 5 — Sep 25
```

These periods are completely independent.

---

# 18. Enrollment Period Rules

Group Classes

Students may enroll only during an active enrollment period.

Individual Classes

Students may enroll at any time.

Multiple enrollment periods may exist simultaneously provided they belong to different:

- Branchs
- Programs
- Sub Programs
- Class Types

Active enrollment periods for the same combination must not overlap.

---

# 19. Enrollment Payments

Every enrollment has one associated payment.

Programs currently use one-time payments.

No installment support is required.

Enrollment Payment exists because of an Enrollment.

---

# 20. Payment Methods

Two payment methods are supported.

## In-Person

The Secretary manually records the payment.

---

## Online

Students pay using the configured payment provider.

Supported providers include:

- Chapa
- Stripe

The Academic application communicates only with the configured payment integration.

---

# 21. Academic Staff Roles

## Super Admin

Has unrestricted access.

Can perform every academic operation across every branch.

---

## Branch Manager

Scoped to the managed branch.

Responsible for managing all academic activities within that branch.

Can manage:

- Students
- Classes
- Enrollments
- Attendance Sessions
- Attendance Records
- Learning Progress
- Learning Materials
- Certificates
- Reports
- Payments

Cannot access another branch.

---

## Secretary

Scoped to one branch.

Responsible for daily academic operations.

Can:

- Register students
- Create student profiles
- Create enrollments
- Assign students to classes
- Record in-person payments
- Generate reports
- Issue certificates
- View student academic information

Cannot manage academic structure such as Programs or Sub Programs.

---

## Instructor

Responsible for teaching.

Can:

- View assigned classes
- Create attendance sessions
- Record attendance for students
- Update student progress
- Upload learning materials
- Update own learning materials
- Delete own learning materials
- View all learning materials

Cannot:

- Register students
- Create enrollments
- Manage payments

---

# 22. Attendance

Attendance is recorded per Class Session.

Teachers create an Attendance Session for each class meeting.

Students are then marked within that session through Attendance Records.

Attendance Records belong to an Attendance Session and reference the student's Enrollment.

This supports both Group and Individual classes without requiring different models.

For Individual classes, each Attendance Session simply contains one Attendance Record.

Attendance forms part of the student's academic history.

---

# 23. Flexible Learning Progress

Every Sub Program defines its own learning milestones.

Example

Python

- Variables
- Loops
- Functions
- OOP

English

- Grammar
- Vocabulary
- Reading
- Conversation

The system does not impose a fixed curriculum.

---

# 24. Student Progress

Each student's progress is tracked independently for individual programs.

But for group class the class owns progress and attendance

Example

```text
Python

Variables

Completed

Loops

Completed

Functions

In Progress

OOP

Not Started
```

---

# 25. Learning Materials

Learning Materials belong directly to a Sub Program.

Examples include:

- PDF
- PowerPoint
- Word Documents
- Images
- Other educational resources

Materials are intentionally attached directly to the Sub Program to keep the structure simple.

---

# 26. Learning Material Access

Students

May access materials only for Sub Programs they are enrolled in.

Academic Staff

All Instructors, Branch Managers, and Super Admins may view all learning materials.

Uploading and modification remain ownership-based.

---

# 27. Certificates

Every Sub Program owns its own Certificate.

Examples

Programming

- Python Certificate
- AI Certificate

Languages

- English Certificate

Certificates are independent between Sub Programs.

---

# 28. Certificate Issuing

Certificates are issued manually by authorized staff.

The system does not automatically determine completion.

Authorized users decide when a student has successfully completed a Sub Program.

---

# 29. Student Certificates

Once issued, a Student Certificate becomes an official academic record.

The issued certificate remains permanent and downloadable.

Updating the certificate design does not change previously issued certificates.

---

# 30. Student Academic Reports

Student Reports summarize the student's complete academic history.

Reports include:

- Student Information
- Current Enrollments
- Attendance Records
- Learning Progress
- Certificates

Reports are generated dynamically.

Reports are downloadable as PDF.

Reports are not permanently stored.

---

# 31. Academic Workflow

```text
Student Admission

↓

Enrollment

↓

Enrollment Payment

↓

Active Enrollment

↓

Attendance Session

↓

Attendance Record

↓

Learning Progress

↓

Certificate Issuance

↓

Student Report
```

---



# 32. Design Principles

The Academic application follows the following principles.

- Match the institute's real business workflow.
- Keep the architecture simple.
- Use Django conventions wherever possible.
- Avoid unnecessary abstraction.
- Design for long-term scalability.
- Separate business architecture from implementation.
- Keep external integrations outside the Academic application.
- Generate reports dynamically instead of storing them.
- Treat certificates as permanent academic records.
- Keep student history complete and immutable.

---

# 33. Locked Architecture Summary

The Academic application is centered around the student's academic journey.

A student enters the system through Admission, studies through Enrollments and Classes, progresses through Learning Milestones, accesses Learning Materials, receives Certificates upon completion, and can generate a complete Academic Report at any time.

This architecture reflects the institute's current operational workflow while providing a solid foundation for future academic expansion.

---

# Status

**🔒 LOCKED**

