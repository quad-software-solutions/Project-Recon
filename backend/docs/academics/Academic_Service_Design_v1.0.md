# Project Recon

# Academic Application Services Design

**Status:** 🔒 LOCKED

**Application:** `academic`

> This document defines the business service layer of the Academic application. It describes business responsibilities only and intentionally excludes APIs, serializers, views, permissions, and model implementation.

---

# 1. Service Design Principles

The Academic application follows a business-oriented service architecture.

Services represent complete business operations rather than simple CRUD operations.

Each service owns one business capability.

Services coordinate models instead of exposing model-level operations.

---

# 2. Service Overview

```text
Academic

├── Admission Service
├── Student Service
├── Program Service
├── Class Service
├── Enrollment Service
├── Enrollment Period Service
├── Payment Service
├── Attendance Service
├── Progress Service
├── Learning Material Service
├── Certificate Service
└── Academic Report Service
```

---

# 3. Admission Service

## Purpose

Owns the complete student admission workflow.

Admission is the only way a Student profile is created.

---

## Responsibilities

- Register new students
- Create User
- Create Student Profile
- Create Initial Enrollment
- Create Initial Enrollment Payment
- Validate enrollment period
- Return admission result

---

## Owns

- Student
- Enrollment
- Enrollment Payment

---

## Does NOT

- Record attendance
- Manage programs
- Issue certificates

---

# 4. Student Service

## Purpose

Manages existing student information.

---

## Responsibilities

- Update student information
- Transfer student branch (future)
- Activate student
- Deactivate student
- Search students
- Retrieve academic profile

---

## Does NOT

- Create students
- Enroll students

Student creation belongs only to Admission Service.

---

# 5. Program Service

## Purpose

Owns academic catalog management.

---

## Responsibilities

- Create Program
- Update Program
- Deactivate Program
- Create Sub Program
- Update Sub Program
- Configure fees
- Configure supported learning types

---

# 6. Class Service

## Purpose

Owns teaching classes.

---

## Responsibilities

- Create Class
- Update Class
- Assign Instructor
- Change Instructor
- Activate Class
- Deactivate Class
- Manage capacity

---

# 7. Enrollment Service

## Purpose

Owns enrollments after student admission.

---

## Responsibilities

- Enroll existing student
- Validate enrollment period
- Create Enrollment
- Create Enrollment Payment
- Cancel Enrollment
- Complete Enrollment
- Retrieve enrollment history

---

## Does NOT

Create Student Profiles.

---

# 8. Enrollment Period Service

## Purpose

Controls registration periods.

---

## Responsibilities

- Create enrollment periods
- Update enrollment periods
- Activate periods
- Deactivate periods
- Validate overlapping periods

---

# 9. Payment Service

## Purpose

Owns enrollment payments.

---

## Responsibilities

- Record cash payments
- Initialize online payment
- Verify payment
- Complete payment
- Cancel payment
- Refund payment (future)

---

## External Communication

Payment Service communicates with the configured payment provider.

Academic never communicates directly with Chapa or Stripe.

---

# 10. Attendance Service

## Purpose

Owns the attendance workflow.

Manages two coordinated operations:

1. Create Attendance Sessions
2. Record Attendance for students within those sessions

---

## Responsibilities

- Create Attendance Session
- Update Attendance Session
- Record Attendance
- Update Attendance Record
- Retrieve Session
- Retrieve Student Attendance History
- Generate Attendance Summary

---

# 11. Progress Service

## Purpose

Owns learning progress.

---

## Responsibilities

- Create milestones
- Update milestones
- Record progress
- Update progress
- Retrieve student progress

---

# 12. Learning Material Service

## Purpose

Owns educational resources.

---

## Responsibilities

- Upload material
- Update material
- Remove material
- List materials
- Download materials

---

# 13. Certificate Service

## Purpose

Owns certificate lifecycle.

---

## Responsibilities

- Manage certificate templates
- Generate certificate PDF
- Issue certificate
- Download certificate
- Verify certificate ownership

---

# 14. Academic Report Service

## Purpose

Generates student academic reports.

Reports are generated dynamically.

---

## Responsibilities

- Generate PDF report
- Generate enrollment history
- Generate attendance summary
- Generate progress summary
- Generate certificate summary

---

# 15. Service Relationships

```text
Admission Service
        │
        ├─────────────┐
        ▼             ▼
Student Service   Enrollment Service
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
Payment Service   Attendance Service   Progress Service
                                            │
                                            ▼
                                  Certificate Service
                                            │
                                            ▼
                                  Academic Report Service
```

---

# 16. Service Communication Rules

Services may call other services when required.

Example

Admission Service

↓

Enrollment Service

↓

Payment Service

Services never access another service's internal logic through models.

Communication should occur through public service methods.

---

# 17. Transaction Boundaries

The following operations execute as a single database transaction.

## Admission

- Create User
- Create Student
- Create Enrollment
- Create Payment

---

## Enrollment

- Create Enrollment
- Create Payment

---

## Certificate Issuance

- Generate PDF
- Create Student Certificate

---



# 18. Locked Design Decisions

- Services represent business workflows rather than individual models.
- Student creation belongs exclusively to Admission Service.
- Enrollment after admission belongs to Enrollment Service.
- Reports are generated dynamically.
- Certificates are issued through Certificate Service.
- Payment integration is isolated behind Payment Service.
- External providers are never accessed directly by other services.
- Business transactions are handled atomically.

---

# Status

**🔒 LOCKED**
