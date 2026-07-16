# Project Recon

# Academic Application Services Design

**Status:** LOCKED

**Application:** `academic`

---

# 1. Service Design Principles

Services represent complete business operations rather than simple CRUD operations. Each service owns one business capability.

---

# 2. Service Overview

```text
Academic

├── Student Service
├── Program Service
├── Class Service
├── Admission Service
├── Enrollment Service
├── Enrollment Period Service
├── Payment Service
├── Attendance Service
├── Progress Service
├── Learning Material Service
├── Certificate Service
├── Staff Attendance Service
├── Transfer Service
└── Academic Report Service
```

---

# 3. Student Service

## Responsibilities

- get_student_or_404(pk)
- get_student_profile(pk)
- update_student(student, actor, **kwargs) — updates user + student fields in a transaction, logs action
- list_students()
- search_students(query) — filters by name, email, phone
- activate_student(student, actor)
- deactivate_student(student, actor)

Does NOT create students — that belongs only to Admission Service.

---

# 4. Program Service

## Responsibilities

- get_program_or_404(pk)
- list_programs()
- create_program(*, name, slug, description, supports_group, supports_individual)
- update_program(program, **kwargs)
- activate_program(program)
- deactivate_program(program)
- get_sub_program_or_404(pk)
- list_sub_programs()
- create_sub_program(*, program, name, slug, description, duration, duration_unit, group_fee, individual_fee)
- update_sub_program(sub_program, **kwargs)
- activate_sub_program(sub_program)
- deactivate_sub_program(sub_program)

---

# 5. Class Service

## Responsibilities

- get_class_or_404(pk)
- get_active_class_or_404(pk)
- list_classes()
- create_class(*, sub_program, branch, instructor, name, class_type, class_period, capacity, start_date, end_date)
- update_class(klass, **kwargs)
- assign_instructor(klass, instructor)
- activate_class(klass)
- deactivate_class(klass)

Capacity is enforced: INDIVIDUAL always = 1, GROUP requires >0.

---

# 6. Admission Service

## Responsibilities

- admit_student(*, email, first_name, last_name, password, phone_number, branch, date_joined, guardian_name, guardian_phone, guardian_email, assigned_by)

Creates User via UserService, creates Student, logs action. This is the only way a Student profile is created by staff.

---

# 7. Enrollment Service

## Responsibilities

- get_enrollment_or_404(pk)
- list_enrollments()
- enroll_student(actor, *, student, enrolled_class, remarks) — validates period, capacity, duplicates; creates PENDING_VERIFICATION
- online_enrollment(*, user, enrolled_class, payment_method, transaction_reference, bank_name, transfer_reference, attachment, email, first_name, last_name, password, phone_number, guardian fields) — self-service, handles new/existing users, creates enrollment + payment, sends confirmation email
- cancel_enrollment(actor, enrollment) — only PENDING_VERIFICATION or ACTIVE
- complete_enrollment(actor, enrollment) — only ACTIVE
- move_enrollment(actor, *, enrollment, target_class) — change class within same SubProgram
- bulk_move_enrollments(actor, *, source_class, target_class, enrollment_ids, count) — bulk version
- switch_subprogram(actor, *, current_enrollment, target_class) — cancels old, creates new, repoints records
- get_all_related_enrollments(enrollment) — follows transferred_from chain

---

# 8. Enrollment Period Service

## Responsibilities

- get_enrollment_period_or_404(pk)
- list_enrollment_periods()
- create_enrollment_period(actor, *, branch, program, sub_program, class_type, class_period, title, start_date, end_date)
- update_enrollment_period(actor, period, **kwargs)
- activate_enrollment_period(actor, period)
- deactivate_enrollment_period(actor, period)

---

# 9. Payment Service

## Responsibilities

- get_payment_or_404(pk)
- list_payments()
- record_payment(actor, *, enrollment, amount, payment_method, payment_date, transaction_reference, bank_name, transfer_reference, attachment, verification_notes) — creates VERIFIED payment, sets enrollment ACTIVE, generates enrollment_number, sends email
- reject_payment(actor, *, enrollment, rejection_reason) — sets enrollment REJECTED, payment CANCELLED, sends email
- set_under_review(actor, *, enrollment) — sets verification_status to UNDER_REVIEW

---

# 10. Attendance Service

## Responsibilities

- create_session(actor, *, enrolled_class, session_date, topic)
- get_session_or_404(pk)
- list_sessions(enrolled_class, date_from, date_to)
- update_session(actor, session, *, session_date, topic)
- record_attendance(actor, *, session, enrollment, status, remarks)
- bulk_record_attendance(actor, *, session, records) — update_or_create with transaction
- update_attendance_record(actor, record, *, status, remarks)
- get_enrollment_attendance_history(enrollment)
- get_attendance_summary(enrollment) — returns counts

---

# 11. Progress Service

## Responsibilities

- get_milestone_or_404(pk)
- list_milestones(sub_program, scope_class, include_inactive)
- create_milestone(actor, *, sub_program, title, description, scope_class)
- update_milestone(actor, milestone, *, title, description)
- archive_milestone(actor, milestone) — sets is_active=False
- customize_milestone(actor, source_milestone, target_class) — copies shared milestone to class-specific
- record_progress(actor, *, enrollment, milestone, status, remarks)
- update_progress(actor, record, *, status, remarks)
- get_progress_history(enrollment)
- get_progress_summary(enrollment) — returns counts

---

# 12. Learning Material Service

## Responsibilities

- upload_material(actor, *, sub_program, title, file, description)
- update_material(actor, material, *, title, description, file)
- delete_material(actor, material) — soft delete
- get_material_or_404(pk)
- list_materials(sub_program, uploaded_by)
- get_student_materials(student) — materials for enrolled SubPrograms

Enforces instructor validation, file type detection, image re-encoding, and shared file validation.

---

# 13. Certificate Service

## Responsibilities

- get_certificate_template_or_404(pk)
- list_certificate_templates(sub_program, active_only)
- create_certificate(actor, *, sub_program, title, background, body_text, institute_logo, signature)
- update_certificate(actor, certificate, *, title, body_text, background, institute_logo, signature)
- activate_certificate(actor, certificate)
- deactivate_certificate(actor, certificate)
- issue_certificate(actor, *, student, certificate) — validates, generates number, creates StudentCertificate
- get_student_certificate_or_404(pk)
- get_student_certificate_by_number(number)
- get_student_certificates(student, sub_program)

---

# 14. Staff Attendance Service

## Responsibilities

- create_session(*, branch, date, created_by, notes)
- get_session_or_404(pk)
- list_sessions(branch, date_from, date_to, status)
- update_session(actor, session, **kwargs)
- publish_session(actor, session) — DRAFT → PUBLISHED
- soft_delete_session(actor, session)
- upsert_records(actor, session, records_data) — bulk update_or_create
- get_record_or_404(pk)
- update_record(actor, record, **kwargs)
- delete_record(actor, record)
- list_available_staff(branch) — active non-student staff
- get_session_records(session)

---

# 15. Transfer Service

## Responsibilities

- get_transfer_request_or_404(pk)
- list_transfer_requests()
- request_transfer(actor, *, enrollment, target_class, to_branch)
- approve_transfer(actor, *, transfer_request) — cancels old enrollment, creates new, repoints records
- reject_transfer(actor, *, transfer_request, rejection_reason)

---

# 16. Academic Report Service

## Responsibilities

- generate_student_report(student_id) → PDF bytes
- generate_enrollment_report(student_id) → PDF bytes
- generate_attendance_report(student_id, enrollment_id) → PDF bytes
- generate_progress_report(student_id, enrollment_id) → PDF bytes
- generate_certificate_report(student_id) → PDF bytes
- generate_class_report(class_id) → PDF bytes
- generate_sub_program_report(sub_program_id) → PDF bytes
- generate_program_report(program_id) → PDF bytes

All reports are generated dynamically using reportlab. Not stored in DB.

---

# 17. Service Relationships

```text
AdmissionService → StudentService, EnrollmentService
EnrollmentService → EnrollmentPeriodService, PaymentService
PaymentService → EmailService (shared)
CertificateService → StudentService
TransferService → EnrollmentService, AttendanceService, ProgressService
```

---

# 18. Transaction Boundaries

The following operations execute as a single database transaction:

- Admission (user creation, student creation)
- Enrollment (create enrollment, create payment)
- Online enrollment (user creation, student creation, enrollment, payment)
- Payment verification (update payment, update enrollment status)
- Switch subprogram (cancel old, create new, repoint records)
- Certificate issuance

---

# 19. Services that send email

- enrollment_service.online_enrollment() — sends submission confirmation with pending_code
- payment_service.record_payment() — sends approval with enrollment_number
- payment_service.reject_payment() — sends rejection with reason

---

**Status:** LOCKED
