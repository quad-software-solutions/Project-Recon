# Academic App — Complete Workflow

## Post-Manual-Payment-Verification Implementation

---

## Enrollment Methods

There are two ways a student gets enrolled:

| Method | Who Creates | Payment Verification | Enter Queue? |
|--------|-------------|---------------------|-------------|
| **Walk-in** | Staff (Super Admin, Branch Manager, Secretary) | Automatic (staff records payment at time of creation) | No |
| **Online** | Applicant (public or student) | Manual (staff reviews evidence later) | Yes |

---

## Walk-in Enrollment Flow

**Actors:** Super Admin, Branch Manager, or Secretary

### Step 1 — Staff Admit Student

```
POST /api/v1/academic/enrollments/
```

Staff sends:

```json
{
  "student": "<student-uuid>",
  "enrolled_class": "<class-uuid>",
  "remarks": "Optional notes"
}
```

**System validates:**
- Student exists and is active
- Class exists and is active
- Enrollment period is valid (for Group classes)
- Class has available capacity
- No duplicate active enrollment for this student+class

**Result:** `Enrollment(status=PENDING_VERIFICATION)` created.

---

### Step 2 — Staff Records Payment

```
POST /api/v1/academic/payments/
```

Staff sends:

```json
{
  "enrollment": "<enrollment-uuid>",
  "amount": 2500.00,
  "payment_method": "CASH",
  "transaction_reference": "",
  "bank_name": "",
  "transfer_reference": "",
  "verification_notes": "Cash counted at front desk."
}
```

**System validates:**
- Enrollment exists in `PENDING_VERIFICATION` status
- No existing payment record
- For non-cash: at least one of `transaction_reference` or `attachment`
- Amount > 0

**System does (in one transaction):**
1. Creates `EnrollmentPayment(status=PAID, verified_by=staff, verified_at=now, ...)`
2. Generates `enrollment_number` → `ENR-2026-000087`
3. Sets `Enrollment.status = ACTIVE`
4. Sets `Enrollment.verification_status = VERIFIED` (was null for walk-in)
5. Logs audit action: `payment.recorded`

**Result:** Student is now active in the class. Confirmation email sent (TODO).

---

### Step 3 — Staff Can Also Cancel or Complete

```
POST /api/v1/academic/enrollments/<uuid>/cancel/
POST /api/v1/academic/enrollments/<uuid>/complete/
```

Cancellation allowed from: `PENDING_VERIFICATION` or `ACTIVE`
Completion allowed only from: `ACTIVE`

---

## Online Enrollment Flow

**Actors:** Public applicant (unauthenticated) or existing Student (authenticated)

### Step 1 — Applicant Submits Enrollment Request

```
POST /api/v1/academic/enrollments/online/
```

**Unauthenticated applicant sends:**

```json
{
  "enrolled_class": "<class-uuid>",
  "email": "applicant@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepass123",
  "phone_number": "+251911223344",
  "guardian_name": "Jane Doe",
  "guardian_phone": "+251922334455",
  "payment_method": "BANK_TRANSFER",
  "transaction_reference": "TXN-ABC-123",
  "bank_name": "Commercial Bank of Ethiopia",
  "transfer_reference": "REF-98765"
}
```

**Authenticated student sends (no personal info needed):**

```json
{
  "enrolled_class": "<class-uuid>",
  "payment_method": "MOBILE_MONEY",
  "transaction_reference": "MM-445566",
  "bank_name": "M-Pesa"
}
```

**Validation rules:**
- For non-cash: at least `transaction_reference` or file `attachment` required
- For cash: no evidence required
- Enrollment period + capacity checks (same as walk-in)

**System does (in one transaction):**

| Sub-step | For new user | For existing student |
|----------|-------------|-------------------|
| Create User | ✓ email/first/last/password → creates `User` | — |
| Create Student | ✓ creates `Student` linked to branch | — |
| Check duplicates | ✓ check existing enrollment | ✓ check existing enrollment |
| Create Enrollment | `status=PENDING_VERIFICATION`, `verification_status=SUBMITTED`, `pending_code=ENR-P-2026-000143` | same |
| Create Payment | `EnrollmentPayment(status=PENDING, payment_method, transaction_reference, bank_name, ...)` | same |
| Audit log | `enrollment.online_created` | same |

**Response (201 Created):**

```json
{
  "id": "<enrollment-uuid>",
  "pending_code": "ENR-P-2026-000143",
  "status": "PENDING_VERIFICATION",
  "student": { ... },
  "enrolled_class": { ... },
  "payment": {
    "amount": 2500.00,
    "payment_method": "BANK_TRANSFER",
    "transaction_reference": "TXN-ABC-123",
    "status": "PENDING"
  }
}
```

(TODO: Send "submitted" notification email with pending_code)

---

### Step 2 — Verification Queue

```
GET /api/v1/academic/payments/verification-queue/
```

**Who can access:** Super Admin, Branch Manager, Secretary (scoped to their
branch)

**Shows enrollment requests where:**
- `status = PENDING_VERIFICATION`
- `verification_status IN (SUBMITTED, UNDER_REVIEW)`

**Each queue item displays:**
- Pending Enrollment Code
- Applicant name
- Program / Sub Program / Class
- Branch
- Amount
- Payment method
- Transaction reference
- Payment attachment (downloadable)
- Submission time
- Current status (SUBMITTED / UNDER_REVIEW)

---

### Step 3 — Staff Reviews Request (Optional: Mark Under Review)

```
POST /api/v1/academic/payments/<enrollment-uuid>/under-review/
```

Staff clicks "Start Review" → sets `verification_status = UNDER_REVIEW`

This step is optional — staff can skip straight to approve or reject.

---

### Step 4a — Staff Approves (Verifies Payment)

Staff records the approval. This can either go through the verification queue
UI or directly via the payments endpoint.

**Option A: From queue UI** — Staff clicks "Verify" and the system:
1. Sets enrollment to `ACTIVE`
2. Sets payment to `PAID` with `verified_by`/`verified_at`
3. Generates `enrollment_number`

**Option B: Via `POST /api/v1/academic/payments/`** (same as walk-in):

```json
{
  "enrollment": "<enrollment-uuid>",
  "amount": 2500.00,
  "payment_method": "BANK_TRANSFER",
  "transaction_reference": "TXN-ABC-123",
  "bank_name": "Commercial Bank of Ethiopia",
  "verification_notes": "Verified against bank statement. Payment confirmed."
}
```

**System does (in one transaction):**
1. Creates `EnrollmentPayment(status=PAID, verified_by=staff, verified_at=now, verification_notes=...)`
2. Generates `enrollment_number` → `ENR-2026-000088`
3. Sets `Enrollment.status = ACTIVE`
4. Sets `Enrollment.verification_status = VERIFIED`
5. Sets `pending_code = null` (the temporary code is no longer needed)
6. Logs audit action: `payment.verified_success`

(If an existing payment record already exists in PENDING state from the online
enrollment submission, the system updates that record instead of creating a
new one.)

**Result:** Student is now active. Official Enrollment Number generated.
(TODO: Send "approved" notification email with enrollment_number)

---

### Step 4b — Staff Rejects

```
POST /api/v1/academic/payments/<enrollment-uuid>/reject/
```

**Who can do this:** Super Admin, Branch Manager, Secretary

**Request:**

```json
{
  "rejection_reason": "Transaction reference not found in bank records."
}
```

**System does (in one transaction):**
1. Sets `Enrollment.verification_status = REJECTED`
2. Sets `Enrollment.rejection_reason = "Transaction reference not found in bank records."`
3. Sets `EnrollmentPayment.status = CANCELLED`
4. Logs audit action: `payment.verified_failed`

(TODO: Send "rejected" notification email with reason)

---

## Lifecycle After Verification

Once `Enrollment.status = ACTIVE`, the student proceeds through the standard
academic lifecycle:

```
ACTIVE
  │
  ├── Attendance Sessions created by Instructor
  │     └── Attendance Records recorded
  │
  ├── Learning Progress tracked
  │     └── Milestones marked NOT_STARTED → IN_PROGRESS → COMPLETED
  │
  ├── Certificate issued (by staff)
  │
  └── Eventually → COMPLETED (by staff)
```

---

## Complete Enrollment Lifecycle Summary

### Walk-in Enrollment

```
Staff creates enrollment (enroll_student)
  │
  ▼
Enrollment(status=PENDING_VERIFICATION)
  │
  ▼
Staff records payment (record_payment)
  │
  ▼
Payment(status=PAID, verified_by=staff, verified_at=now)
Enrollment(status=ACTIVE, enrollment_number=ENR-2026-NNNNNN)
  │
  ▼
  ... academic lifecycle ...
  │
  ▼
COMPLETED  or  CANCELLED
```

### Online Enrollment

```
Applicant submits enrollment + payment evidence (online_enrollment)
  │
  ▼
Enrollment(status=PENDING_VERIFICATION, verification_status=SUBMITTED, pending_code=ENR-P-2026-NNNNNN)
Payment(status=PENDING, with evidence)
  │
  ▼
Enters Pending Verification Queue
  │
  ▼
Staff reviews queue
  │
  ├── Staff skips to approve
  │     │
  │     ▼
  │   record_payment() → Payment(status=PAID), Enrollment(status=ACTIVE, enrollment_number=ENR-2026-NNNNNN)
  │
  ├── Staff marks UNDER_REVIEW → then approves
  │     │
  │     ▼
  │   Same as above
  │
  └── Staff rejects
        │
        ▼
      reject_payment() → Payment(status=CANCELLED), Enrollment(verification_status=REJECTED, rejection_reason=...)
```

---

## Staff Role Permissions Summary

| Action | Super Admin | Branch Manager | Secretary | Instructor |
|--------|:-----------:|:--------------:|:---------:|:----------:|
| Create walk-in enrollment | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| Record payment (verify) | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| View verification queue | ✓ (all) | ✓ (own branch) | ✓ (own branch) | ✗ |
| Mark under review | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| Reject enrollment | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| Cancel enrollment | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| Complete enrollment | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |
| Create attendance sessions | — | — | — | ✓ |
| Record attendance | — | — | — | ✓ |
| Update progress | — | — | — | ✓ |
| Issue certificates | ✓ | ✓ (own branch) | ✓ (own branch) | ✗ |

---

## Data Flow Diagram

```
                  ┌────────────────────────────────────────────┐
                  │              Applicant / Student           │
                  │         (online_enrollment)                │
                  └────────────────────┬───────────────────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────────┐
                  │      Enrollment(status=PENDING_VERIFICATION)│
                  │      Payment(status=PENDING, evidence)     │
                  │      pending_code=ENR-P-2026-NNNNNN       │
                  └────────────────────┬───────────────────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────────┐
                  │         Pending Verification Queue         │
                  │  (staff reviews evidence)                  │
                  └──────┬──────────────────────┬──────────────┘
                         │                      │
                         ▼                      ▼
              ┌──────────────────┐   ┌──────────────────────┐
              │   Staff Approves │   │   Staff Rejects      │
              │  (record_payment)│   │  (reject_payment)    │
              └────────┬─────────┘   └──────────┬───────────┘
                       │                        │
                       ▼                        ▼
              ┌──────────────────┐   ┌──────────────────────┐
              │ Enrollment=ACTIVE│   │ verification_status  │
              │ enrollment_number│   │ = REJECTED           │
              │ Payment=PAID     │   │ Payment=CANCELLED    │
              └──────────────────┘   └──────────────────────┘
                       │
                       ▼
              ┌────────────────────────────────────────────┐
              │       Academic Lifecycle                   │
              │  (Attendance → Progress → Certificate)     │
              └────────────────────────────────────────────┘
```

For **walk-in**, the flow skips the queue entirely — staff creates enrollment
and records payment in one operation, going directly to `ACTIVE` status.

---

## Phase 2 — Cross-Enrollment Operations

---

### Class Move (Individual)

Move a single ACTIVE enrollment to another class within the same branch.

```
POST /api/v1/academic/enrollments/<pk>/move/
{
  "target_class": "<class-uuid>"
}
```

**System validates:**
- Enrollment is ACTIVE
- Target class exists, is active
- Target class belongs to same branch as source class
- Target class has available capacity
- No duplicate ACTIVE enrollment for this student + target class
- If target is GROUP: enrollment period is valid

**System does (in one transaction):**
1. Records old class for audit
2. Updates `enrollment.enrolled_class = target_class`
3. Logs audit action: `enrollment.moved` with old_class, new_class

**Response:** Updated `EnrollmentSerializer`

---

### Class Split (Bulk Move)

Move multiple ACTIVE enrollments from one class to another (typically
when a class is too large and needs splitting).

```
POST /api/v1/academic/classes/<pk>/split/
```

Mode 1 — specific enrollments:

```json
{
  "target_class": "<new-class-uuid>",
  "enrollment_ids": ["<uuid>", "<uuid>"]
}
```

Mode 2 — by count (moves the oldest N):

```json
{
  "target_class": "<new-class-uuid>",
  "count": 25
}
```

**Permissions:** Admin only (Super Admin, Branch Manager)

**System validates:**
- All source enrollments are ACTIVE
- Target class has enough capacity for all being moved
- No duplicates created
- All other class-level validations

**System does (in one transaction):**
1. Resolves enrollments to move (by IDs or oldest N)
2. Updates each `enrollment.enrolled_class = target_class`
3. Logs audit action: `enrollment.bulk_moved` with count, old_class, new_class

**Response:** List of `EnrollmentSerializer`

---

### Subprogram Switch

A student stays at the same branch but switches subprogram (or GROUP/INDIVIDUAL
type within the same subprogram).

```
POST /api/v1/academic/enrollments/<pk>/switch-subprogram/
{
  "target_class": "<class-uuid>"
}
```

**Permissions:** Staff

**System validates:**
- Current enrollment is ACTIVE
- Target class is active, has capacity, same branch
- No duplicate ACTIVE enrollment for this student + target class
- Fee difference is non-negative (no refunds)

**System does (in one transaction):**
1. Calculates fee difference: `new_amount - old_amount` (min 0)
2. Cancels old enrollment (status = CANCELLED)
3. Creates new Enrollment with:
   - Same student
   - `enrolled_class = target_class`
   - `status = ACTIVE`
   - `transferred_from = old_enrollment`
   - New `enrollment_number` generated
4. Creates `EnrollmentPayment(status=PAID, amount=amount_due or 0, verified_by=actor, ...)`
5. Repoints attendance/progress/certificate records to new enrollment
6. Logs audit action: `enrollment.subprogram_switched`

**Response:**
```json
{
  "old_enrollment": {"id": "...", "status": "CANCELLED"},
  "new_enrollment": {"id": "...", "status": "ACTIVE", "transferred_from": "..."},
  "amount_due": 500.00,
  "payment": {"amount": 500.00, "status": "PAID"}
}
```

---

### Branch Transfer

A student moves from one branch to another, typically requiring admin approval
from the destination branch.

#### Step 1 — Staff Requests Transfer

```
POST /api/v1/academic/transfers/request/
{
  "enrollment": "<enrollment-uuid>",
  "target_class": "<class-uuid>",
  "to_branch": "<branch-uuid>"
}
```

**Permissions:** Any academic staff

**System validates:**
- Enrollment is ACTIVE, belongs to from_branch
- Target class is active & belongs to to_branch
- to_branch != from_branch
- Target class has capacity
- No PENDING transfer already exists for this enrollment

**Result:** `BranchTransferRequest(status=PENDING)` created

#### Step 2a — Admin Approves Transfer

```
POST /api/v1/academic/transfers/<pk>/approve/
{}
```

**Permissions:** Admin (Super Admin or Branch Manager of destination branch)

**System does (in one transaction):**
1. Cancels old enrollment (status = CANCELLED)
2. Creates new Enrollment in target class at to_branch:
   - Same student
   - `status = ACTIVE`
   - `transferred_from = old_enrollment`
   - New `enrollment_number`
3. Creates `EnrollmentPayment(status=PAID, amount=0, notes="Branch transfer")`
4. Repoints all attendance/progress/certificate records from old to new enrollment
5. Sets `transfer_request.status = APPROVED, approved_by=actor, approved_at=now`
6. Logs audit action: `transfer.approved`

**Response:**
```json
{
  "new_enrollment": {"id": "...", "enrollment_number": "ENR-2026-000089", ...},
  "transfer_request": {"id": "...", "status": "APPROVED", ...}
}
```

#### Step 2b — Admin Rejects Transfer

```
POST /api/v1/academic/transfers/<pk>/reject/
{
  "rejection_reason": "Target branch has no available slots."
}
```

**Permissions:** Admin

**Result:** `transfer_request.status = REJECTED`. Original enrollment remains ACTIVE.

#### List Transfer Requests

```
GET /api/v1/academic/transfers/
```

Filterable by status, from_branch, to_branch. Returns paginated list.

---

### Record Aggregation

When a student has linked enrollments through subprogram switches or branch
transfers, reports aggregate data across the `transferred_from` chain.

**Chain traversal:**

```python
def get_all_related_enrollments(enrollment):
    chain = [enrollment]
    current = enrollment
    while current.transferred_from:
        current = current.transferred_from
        chain.insert(0, current)
    return chain
```

**Example chain:**
```
ENR-2026-000001 (Original, transferred_from=null)
  └── ENR-2026-000050 (Switch, transferred_from=ENR-2026-000001)
        └── ENR-2026-000089 (Transfer, transferred_from=ENR-2026-000050)
```

**Aggregated queries:**
- **Attendance:** `AttendanceRecord.objects.filter(enrollment__in=chain)`
- **Progress:** merged milestones across all linked enrollments
- **Certificates:** all certificates from chain members
- **Reports:** chronological display with all enrollment numbers
