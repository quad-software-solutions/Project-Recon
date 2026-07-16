# Project Recon

# Academic Application Workflows v1.0

**Status:** LOCKED

**Application:** `academic`

---

This document describes each business workflow scenario end-to-end, showing which services are called, what validation occurs, and what side effects happen (audit, email, status changes).

---

# 1. Staff Admission

**Purpose:** A staff member (Secretary/Branch Manager/Super Admin) registers a new student.

```text
[Staff] → AdmissionService.admit_student()
  │
  ├── Validates: email, password, branch
  │
  ├── UserService.create_student_user()   → Creates User
  ├── User activation                     → Sets User.is_active = True
  ├── Student.objects.create()            → Creates Student Profile
  │
  ├── log_action(CREATE_STUDENT)         → Audit trail
  │
  └── Returns Student
```

**Entry point:** POST /api/v1/academic/admission/

**Roles allowed:** Secretary, Branch Manager, Super Admin

**After admission:** Student is ready for enrollment (separate step).

---

# 2. Staff Enrollment

**Purpose:** Staff enrolls an existing student into a class.

```text
[Staff] → EnrollmentService.enroll_student()
  │
  ├── Validates:
  │     - Class is active
  │     - No duplicate active enrollment (student + class)
  │     - Enrollment period exists (GROUP only)
  │     - Class has capacity (GROUP only)
  │
  ├── Enrollment.objects.create()
  │     status = PENDING_VERIFICATION
  │
  ├── EnrollmentPayment.objects.create()
  │     amount = group_fee or individual_fee
  │     status = PENDING
  │
  ├── log_action(CREATE_ENROLLMENT)      → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/enrollments/enroll/

**Roles allowed:** Secretary, Branch Manager, Super Admin

---

# 3. Self-Service Online Enrollment

**Purpose:** A prospective student enrolls themselves via the public website.

```text
[User] → EnrollmentService.online_enrollment()
  │
  ├── Validates:
  │     - Class is active
  │     - Enrollment period exists (GROUP only)
  │     - Class has capacity (GROUP only)
  │     - No duplicate active enrollment
  │     - Payment method is valid
  │     - Non-cash payments have reference or attachment
  │
  ├── If user doesn't exist:
  │     ├── UserService.create_student_user()  → Creates User
  │     ├── Student.objects.create()            → Creates Student
  │     └── User is_active = True
  │
  ├── If user exists (returning student):
  │     └── Reuses existing Student profile
  │
  ├── Enrollment.objects.create()
  │     status = PENDING_VERIFICATION
  │     pending_code = ENR-P-YYYY-NNNNNN  (auto-generated)
  │
  ├── EnrollmentPayment.objects.create()
  │     amount, payment_method, transaction_reference, etc.
  │     status = PENDING_VERIFICATION
  │
  ├── send_email()                         → Email with pending_code
  │     Subject: Enrollment Submitted
  │     Body: Your enrollment is pending verification. Reference: {pending_code}
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/enrollments/online/

**Authentication:** None (public endpoint)

---

# 4. Payment Verification (Staff)

**Purpose:** Staff verifies a pending payment and activates the enrollment.

```text
[Staff] → PaymentService.record_payment()
  │
  ├── Validates:
  │     - Enrollment is PENDING_VERIFICATION
  │     - Payment is PENDING or PENDING_VERIFICATION
  │     - Amount matches class fee
  │     - Non-cash has reference or attachment
  │
  ├── EnrollmentPayment.objects.update()
  │     status = VERIFIED
  │     payment_date = now
  │     verified_by = actor
  │     verified_at = now
  │
  ├── Enrollment.objects.update()
  │     status = ACTIVE
  │     enrollment_number = ENR-YYYY-NNNNNN  (auto-generated)
  │     verification_status = null
  │
  ├── send_email()                         → Email with enrollment_number
  │     Subject: Enrollment Approved
  │     Body: Your enrollment is confirmed. Number: {enrollment_number}
  │
  ├── log_action(VERIFY_PAYMENT)          → Audit trail
  │
  └── Returns EnrollmentPayment
```

**Entry point:** POST /api/v1/academic/payments/record/

**Roles allowed:** Secretary, Branch Manager, Super Admin

---

# 5. Payment Rejection (Staff)

**Purpose:** Staff rejects a payment with a reason.

```text
[Staff] → PaymentService.reject_payment()
  │
  ├── Validates:
  │     - Enrollment is PENDING_VERIFICATION
  │
  ├── Enrollment.objects.update()
  │     status = REJECTED
  │     rejection_reason = provided reason
  │
  ├── EnrollmentPayment.objects.update()
  │     status = CANCELLED
  │
  ├── send_email()                         → Email with rejection reason
  │     Subject: Enrollment Rejected
  │     Body: Your enrollment was rejected. Reason: {rejection_reason}
  │
  ├── log_action(REJECT_PAYMENT)          → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/payments/reject/

**Roles allowed:** Secretary, Branch Manager, Super Admin

---

# 6. Set Under Review

**Purpose:** Staff flags an enrollment for manual review.

```text
[Staff] → PaymentService.set_under_review()
  │
  ├── Validates:
  │     - Enrollment verification_status is SUBMITTED
  │
  ├── Enrollment.objects.update()
  │     verification_status = UNDER_REVIEW
  │
  ├── log_action(REVIEW_ENROLLMENT)       → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/payments/review/

---

# 7. Cancel Enrollment

**Purpose:** Staff cancels an enrollment that has not been completed.

```text
[Staff] → EnrollmentService.cancel_enrollment()
  │
  ├── Validates:
  │     - Status is PENDING_VERIFICATION or ACTIVE (not COMPLETED/CANCELLED/REJECTED)
  │
  ├── Enrollment.objects.update()
  │     status = CANCELLED
  │
  ├── log_action(CANCEL_ENROLLMENT)       → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/enrollments/{id}/cancel/

---

# 8. Complete Enrollment

**Purpose:** Staff marks an enrollment as completed.

```text
[Staff] → EnrollmentService.complete_enrollment()
  │
  ├── Validates:
  │     - Status is ACTIVE (not already completed/cancelled)
  │
  ├── Enrollment.objects.update()
  │     status = COMPLETED
  │
  ├── log_action(COMPLETE_ENROLLMENT)     → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/enrollments/{id}/complete/

---

# 9. Move Enrollment (Single)

**Purpose:** Move an enrollment from one class to another within the same branch and SubProgram.

```text
[Staff] → EnrollmentService.move_enrollment()
  │
  ├── Validates:
  │     - Enrollment is ACTIVE
  │     - Target class is in same branch
  │     - Target class is active
  │     - Target class has capacity (GROUP only)
  │     - Enrollment period exists (GROUP only)
  │
  ├── Enrollment.objects.update()
  │     enrolled_class = target_class
  │
  ├── log_action(MOVE_ENROLLMENT)         → Audit trail
  │
  └── Returns Enrollment
```

**Entry point:** POST /api/v1/academic/enrollments/{id}/move/

---

# 10. Bulk Move Enrollment

**Purpose:** Move multiple enrollments from one source class to a target class.

```text
[Staff] → EnrollmentService.bulk_move_enrollments()
  │
  ├── Validates:
  │     - Source and target classes differ
  │     - Target class is active
  │     - Target class capacity (GROUP only)
  │     - Enrollment period exists (GROUP only)
  │
  ├── Identifies enrollments by:
  │     - Specific enrollment_ids list
  │     - Or count (moves N oldest active enrollments from source)
  │
  ├── For each enrollment: (in transaction)
  │     enrolled_class = target_class
  │
  ├── log_action(BULK_MOVE_ENROLLMENT)    → Audit trail
  │
  └── Returns updated enrollments
```

**Entry point:** POST /api/v1/academic/enrollments/bulk-move/

---

# 11. Switch SubProgram

**Purpose:** Move a student from one SubProgram to another by cancelling the current enrollment and creating a new one.

```text
[Staff] → EnrollmentService.switch_subprogram()
  │
  ├── Validates:
  │     - Current enrollment is ACTIVE
  │     - Target class is active, has capacity, has enrollment period
  │     - No duplicate enrollment in target class
  │
  ├── Cancels current enrollment:
  │     status = CANCELLED
  │
  ├── Creates new enrollment:
  │     status = PENDING_VERIFICATION
  │     transferred_from = old enrollment
  │     enrolled_class = target_class
  │
  ├── Creates enrollment payment:
  │     amount = target fee (or 0 if switch is free)
  │     status = PENDING_VERIFICATION (or VERIFIED if 0)
  │
  ├── Repoints records:
  │     AttendanceRecord.enrollment → new enrollment
  │     StudentProgress.enrollment → new enrollment
  │
  ├── log_action(SWITCH_SUBPROGRAM)       → Audit trail
  │
  └── Returns (new_enrollment, amount_due)
```

**Entry point:** POST /api/v1/academic/enrollments/{id}/switch/

---

# 12. Branch Transfer Request

**Purpose:** Request to transfer an active enrollment to another branch.

```text
[Staff] → TransferService.request_transfer()
  │
  ├── Validates:
  │     - Enrollment is ACTIVE
  │     - From and to branches differ
  │     - Target class belongs to to_branch
  │     - Target class is active
  │     - Target class has capacity (GROUP only)
  │     - No duplicate pending request for this enrollment
  │
  ├── BranchTransferRequest.objects.create()
  │     status = PENDING
  │
  ├── log_action(REQUEST_TRANSFER)        → Audit trail
  │
  └── Returns BranchTransferRequest
```

**Entry point:** POST /api/v1/academic/transfers/request/

---

# 13. Transfer Approval

**Purpose:** Approve a pending transfer request — cancels old enrollment, creates new one in target branch.

```text
[Staff] → TransferService.approve_transfer()
  │
  ├── Validates:
  │     - Request is PENDING
  │     - Old enrollment is ACTIVE
  │     - Target class still has capacity
  │
  ├── Cancels old enrollment: status = CANCELLED
  │
  ├── Creates new enrollment:
  │     status = ACTIVE
  │     transferred_from = old enrollment
  │     enrolled_class = target_class
  │     enrollment_number = same as old (or new)
  │
  ├── Creates new payment:
  │     amount = 0 (no additional fee for transfer)
  │     status = VERIFIED
  │
  ├── Repoints attendance + progress records to new enrollment
  │
  ├── Updates request: status = APPROVED, approved_by, approved_at
  │
  ├── log_action(APPROVE_TRANSFER)        → Audit trail
  │
  └── Returns (new_enrollment, transfer_request)
```

**Entry point:** POST /api/v1/academic/transfers/{id}/approve/

---

# 14. Transfer Rejection

**Purpose:** Reject a pending transfer request.

```text
[Staff] → TransferService.reject_transfer()
  │
  ├── Validates: Request is PENDING
  │
  ├── Updates request:
  │     status = REJECTED
  │     rejection_reason = provided
  │
  ├── log_action(REJECT_TRANSFER)         → Audit trail
  │
  └── Returns BranchTransferRequest
```

**Entry point:** POST /api/v1/academic/transfers/{id}/reject/

---

# 15. Attendance Recording

**Purpose:** Instructor creates an attendance session and records student attendance.

## 15a. Create Session

```text
[Instructor] → AttendanceService.create_session()
  │
  ├── Validates: Instructor teaches this class
  │
  ├── AttendanceSession.objects.create()
  │     enrolled_class, session_date, topic, recorded_by
  │
  ├── log_action(CREATE_SESSION)          → Audit trail
  │
  └── Returns AttendanceSession
```

## 15b. Record Attendance (Single Student)

```text
[Instructor] → AttendanceService.record_attendance()
  │
  ├── Validates:
  │     - Instructor teaches the session's class
  │     - Enrollment belongs to that class
  │     - Enrollment is ACTIVE
  │
  ├── AttendanceRecord.objects.update_or_create()
  │     attendance_session, enrollment, status, remarks
  │
  ├── log_action(RECORD_ATTENDANCE)       → Audit trail
  │
  └── Returns AttendanceRecord
```

## 15c. Bulk Record Attendance

```text
[Instructor] → AttendanceService.bulk_record_attendance()
  │
  ├── Validates instructors for all records
  │
  ├── For each record: (in transaction)
  │     update_or_create AttendanceRecord
  │
  ├── log_action(BULK_RECORD_ATTENDANCE)  → Audit trail
  │
  └── Returns list of AttendanceRecords
```

**Entry points:** POST /api/v1/academic/sessions/ (create), POST /api/v1/academic/sessions/{id}/record/ (single), POST /api/v1/academic/sessions/{id}/bulk-record/ (bulk)

---

# 16. Learning Progress

## 16a. Record Progress

```text
[Instructor] → ProgressService.record_progress()
  │
  ├── Validates:
  │     - Milestone belongs to correct SubProgram/Class
  │     - Enrollment is in that SubProgram
  │     - Instructor teaches the class
  │
  ├── StudentProgress.objects.update_or_create()
  │     enrollment, milestone, status, remarks, updated_by
  │
  ├── log_action(RECORD_PROGRESS)         → Audit trail
  │
  └── Returns StudentProgress
```

## 16b. Customize Milestone

```text
[Instructor] → ProgressService.customize_milestone()
  │
  ├── Copies a shared milestone → class-specific milestone
  │
  ├── Validates:
  │     - Source milestone is shared (scope_class is null)
  │     - Target class belongs to same SubProgram
  │     - Instructor teaches the target class
  │     - No duplicate title in target scope
  │
  ├── Creates new milestone:
  │     sub_program, title, description, scope_class = target_class
  │
  ├── log_action(CUSTOMIZE_MILESTONE)     → Audit trail
  │
  └── Returns new LearningMilestone
```

**Entry points:** POST /api/v1/academic/milestones/{id}/customize/ (customize), POST /api/v1/academic/progress/ (record progress)

---

# 17. Certificate Issuance

**Purpose:** Authorized staff issues a certificate to a student.

```text
[Staff] → CertificateService.issue_certificate()
  │
  ├── Validates:
  │     - Student exists
  │     - Certificate template is active
  │     - No duplicate certificate for this student + SubProgram
  │
  ├── generate_certificate_number()
  │     format: CERT-{slug}-YYYY-NNNN
  │
  ├── StudentCertificate.objects.create()
  │     student, certificate, sub_program, certificate_number, issued_by, issued_at
  │
  ├── log_action(ISSUE_CERTIFICATE)       → Audit trail
  │
  └── Returns StudentCertificate
```

**Entry point:** POST /api/v1/academic/certificates/issue/

**Roles allowed:** Secretary, Branch Manager, Super Admin

---

# 18. Staff Attendance

## 18a. Create Session (Draft)

```text
[Staff] → StaffAttendanceService.create_session()
  │
  ├── StaffAttendanceSession.objects.create()
  │     branch, date, created_by, status = DRAFT
  │
  ├── log_action(CREATE_STAFF_SESSION)    → Audit trail
  │
  └── Returns StaffAttendanceSession
```

## 18b. Upsert Records

```text
[Staff] → StaffAttendanceService.upsert_records()
  │
  ├── Validates: Session is DRAFT
  │
  ├── For each staff_record: (in transaction)
  │     StaffAttendanceRecord.objects.update_or_create()
  │       session, staff_member, status, notes
  │
  └── Returns list of StaffAttendanceRecords
```

## 18c. Publish Session

```text
[Staff] → StaffAttendanceService.publish_session()
  │
  ├── Validates: Session is DRAFT
  │
  ├── StaffAttendanceSession.objects.update()
  │     status = PUBLISHED
  │
  ├── log_action(PUBLISH_STAFF_SESSION)   → Audit trail
  │
  └── Returns StaffAttendanceSession
```

**Entry points:** POST /api/v1/academic/staff-attendance/sessions/ (create), POST .../records/ (upsert), POST .../{id}/publish/ (publish)

---

# 19. Academic Reports

All reports are generated on-demand as PDF downloads. No storage in DB.

```text
[Staff/Student] → AcademicReportService.generate_*_report()
  │
  ├── Queries relevant models
  ├── Builds PDF using reportlab
  │
  └── Returns PDF bytes
```

**Entry point:** GET /api/v1/academic/reports/student/{id}/ (and similar for each report type)

---

**Status:** LOCKED
