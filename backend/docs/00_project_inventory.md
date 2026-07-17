# Project Inventory

**Phase:** 0
**Date:** 2026-07-17
**Objective:** Complete inventory of the backend before security analysis.

---

## 1. Top-Level Project Structure

```
backend/
├── .env.example                # Environment variable template
├── apps/                       # All Django apps
│   ├── academic/               # Academic management
│   ├── accounts/               # Authentication & user management
│   ├── cms/                    # Content management system
│   ├── events/                 # Events, tournaments, workshops
│   ├── shared/                 # Shared utilities (audit, email, bank)
│   └── store/                  # Store/e-commerce
├── config/                     # Django project configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── integrations/
│   │   └── email.py            # Email provider configuration
│   ├── settings.py             # Main settings (581 lines)
│   ├── urls.py                 # Root URL configuration
│   └── wsgi.py
├── docs/                       # Documentation & audit reports
├── manage.py                   # Django management script
├── media/                      # Uploaded media files
├── requirements.txt            # Python dependencies
└── dev-tasks/                  # Development task documents
```

---

## 2. Django Apps

### 2.1 `apps.accounts` — Authentication & User Management

| Component | Files |
|---|---|
| Models | `models/` — User, Branch, UserAssignment, OTPChallenge, TrustedDevice |
| Views | `views/auth.py`, `views/user.py`, `views/branch.py`, `views/assignment.py`, `views/device.py` |
| Serializers | `serializers/auth.py`, `serializers/user.py`, `serializers/branch.py`, `serializers/assignment.py`, `serializers/device.py` |
| URLs | `api/urls.py` — 31 routes |
| Throttles | `api/throttles.py` — LoginAnonThrottle, ForgotPasswordAnonThrottle, ResetPasswordAnonThrottle, OTPRequestUserThrottle, OTPVerifyUserThrottle |
| Permissions | `permissions/__init__.py` (6 classes), `permissions/roles.py` (role helpers) |
| Services | `services/authentication_service.py`, `user_service.py`, `branch_service.py`, `assignment_service.py`, `otp_service.py`, `device_service.py`, `jwt_tokens_services.py` |
| Tasks | `tasks.py` — cleanup_otp_challenges(), cleanup_trusted_devices() |
| Admin | `admin.py` — UserAdmin, BranchAdmin, UserAssignmentAdmin, OTPChallengeAdmin, TrustedDeviceAdmin |
| Constants | `constants.py` — Roles, AccountStatus, BranchStatus, Gender, OTPPurpose, DeviceType, LoginAttemptStatus |
| Validators | `validators.py` — normalize_phone_number() |
| Management | `management/commands/create_super_admin.py` |
| Tests | `tests/test_api.py`, `tests/test_services.py`, `tests/test_models.py`, `tests/api/` |

### 2.2 `apps.shared` — Shared Utilities

| Component | Files |
|---|---|
| Audit Models | `audit/models/` — AuditLog (append-only) |
| Audit Services | `audit/services.py` — log_action() |
| Audit API | `audit/api/` — AuditLogViewSet, IsSuperAdmin, serializer |
| Bank Models | `bank/models/` — BankAccount |
| Bank API | `bank/api/` — BankAccountViewSet, BankAccountPermission, serializer |
| Email Services | `email/services.py` — send_email() |
| Validators | `validators.py` — UploadedFileValidator (ext/MIME/size) |
| Tests | `tests/` for audit, email, bank |

### 2.3 `apps.cms` — Content Management System

| Component | Files |
|---|---|
| Models | `models/` — HeroBanner, NewsArticle, Partner, AboutUs, ContactRequest, FAQ, MapNode, Gallery |
| Views | `api/views/` — Public + Admin views per model + stats.py |
| Serializers | `api/serializers/` — Per model |
| URLs | `api/urls.py` — 30 routes |
| Permissions | `api/permissions.py` — IsCMSStaff |
| Services | `services/` — Per model |
| Admin | `admin.py` |
| Constants | `constants.py` — NewsType, PartnerType, ContactStatus, ContactPriority, MapNodeCategory |
| Tests | `tests/test_api.py`, `tests/test_services.py`, `tests/test_models.py` |

### 2.4 `apps.academic` — Academic Management

| Component | Files |
|---|---|
| Models | 15 models: Program, SubProgram, Class, Student, EnrollmentPeriod, StaffAttendanceSession, StaffAttendanceRecord, Enrollment, EnrollmentPayment, AttendanceSession, AttendanceRecord, LearningMilestone, LearningMaterial, StudentProgress, Certificate, StudentCertificate, BranchTransferRequest |
| Views | Organized by domain (multiple files) |
| Serializers | Organized by domain |
| URLs | `api/urls.py` — 86 routes |
| Permissions | IsAcademicAdmin, IsAcademicStaff, CanManageAttendance, CanManageProgress, CanViewReport, CanViewStaffReport, CanManageCertificate, CanViewCertificate, IsAttendanceManager, CanManageMaterial, CanViewMaterial |
| Services | Per-domain service layer |
| Constants | ClassType, DurationUnit, ClassPeriod, AttendanceStatus, SessionStatus, EnrollmentStatus, PaymentMethod, PaymentStatus, ProgressStatus, MaterialType |
| Admin | Custom admin registrations |

### 2.5 `apps.events` — Events & Tournaments

| Component | Files |
|---|---|
| Models | Event, Tournament, TournamentCategory, TournamentTeam, Match, MatchSide, MatchParticipant, Workshop, EventRegistration, EventPayment |
| Views | Public + Admin per domain |
| Serializers | Per model |
| URLs | `api/urls.py` — 78 routes |
| Permissions | IsEventStaff, IsEventRegistrationStaff, IsEventStaffOrInstructor |
| Services | Service layer + validators + queries subpackages |
| Constants | EventStatus, Visibility, RegistrationMode, EventType, WorkshopLevel, MatchStatus, MatchSideType, RegistrationStatus, PaymentStatus, PaymentMethod |
| Admin | Admin registrations |

### 2.6 `apps.store` — Store / E-Commerce

| Component | Files |
|---|---|
| Models | ProductCategory, Product, ProductImage, BranchInventory, ShoppingCart, ShoppingCartItem, PendingOrder, PendingOrderItem, StorePayment, Order, OrderItem, OrderStatusHistory |
| Views | Public + Admin + User views |
| Serializers | Per domain |
| URLs | `api/urls.py` — 71 routes |
| Permissions | IsStoreStaff, IsStoreInventoryStaff |
| Services | Per-domain + utils/csv_export.py |
| Constants | PaymentStatus, PaymentMethod |
| Admin | Admin registrations |

---

## 3. Models (Complete)

### accounts

| Table | Fields |
|---|---|
| `accounts_user` | id (UUID PK), email (unique, db_index), first_name, last_name, phone_number (unique, nullable), profile_picture, date_of_birth, gender, status (db_index), is_email_verified (db_index), is_staff, password, last_login, is_superuser, created_at (db_index), updated_at |
| `accounts_branch` | id (UUID PK), name (unique, db_index), code (unique, db_index), email, phone_number, address, city (db_index), state_region, country (default: Ethiopia), status (db_index), created_at (db_index), updated_at |
| `accounts_user_assignment` | id (UUID PK), user (FK->User, CASCADE), branch (FK->Branch, PROTECT, nullable), role (db_index), is_primary, is_active, assigned_by (FK->User, SET_NULL), created_at (db_index), updated_at. Constraints: unique_user_branch_role, unique_primary_assignment_per_user, super_admin_no_branch_others_must_have_branch |
| `accounts_otp_challenge` | id (UUID PK), user (FK->User, CASCADE), purpose (db_index), otp_code (bcrypt hashed), expires_at (db_index), attempts, resend_count, is_used (db_index), metadata (JSON), created_at (db_index), updated_at |
| `accounts_trusted_device` | id (UUID PK), user (FK->User, CASCADE), device_id (db_index), device_name, device_type, fingerprint (db_index), ip_address, last_used_at (db_index), expires_at, is_active (db_index), created_at (db_index), updated_at. Constraint: unique_user_fingerprint |

### shared

| Table | Fields |
|---|---|
| `shared_audit_log` | id (UUID PK), actor (FK->User, SET_NULL), action (db_index), resource_type (db_index), resource_id (UUID, db_index), branch (FK->Branch, SET_NULL), ip_address, user_agent, details (JSON), created_at (db_index). Immutable (no updates, no deletes) |
| `shared_bank_account` | id (UUID PK), bank_name, account_holder, account_number, branch, swift_code, iban, is_active, notes, created_at, updated_at |

### cms

| Table | Fields |
|---|---|
| `cms_hero_banner` | id (UUID PK), title, subtitle, description, image, video_url, button_text, button_url, is_active (db_index), created_at, updated_at |
| `cms_news_article` | id (UUID PK), title, slug (unique), summary, content, image, video_url, button_text, button_url, type, is_active, published_at, created_at, updated_at |
| `cms_partner` | id (UUID PK), title, description, image, website_url, type, is_active, created_at, updated_at |
| `cms_about_us` | id (UUID PK), title, slug (unique), description, is_active, created_at, updated_at |
| `cms_contact_request` | id (UUID PK), ticket_number (unique), name, email, phone, subject, description, attachment, status, priority, created_at, updated_at |
| `cms_faq` | id (UUID PK), question, answer, is_active, created_at, updated_at |
| `cms_map_node` | id (UUID PK), city, country, title, achievement, x (Float), y (Float), lat, lng, image, category (db_index), is_active, created_at, updated_at |
| `cms_gallery` | id (UUID PK), title, description, image, video_url, is_active, created_at, updated_at |

### academic

| Table | Fields |
|---|---|
| `academic_program` | id (UUID PK), name (unique), slug (unique), description, supports_group, supports_individual, is_active, created_at, updated_at |
| `academic_sub_program` | id (UUID PK), program (FK->Program), name, slug, description, duration, duration_unit, group_fee (Decimal), individual_fee (Decimal), is_active, created_at, updated_at. Constraints: unique name+slug per program |
| `academic_class` | id (UUID PK), sub_program (FK->SubProgram), branch (FK->Branch), instructor (FK->User), name, class_type, class_period, capacity, start_date, end_date, is_active, created_at, updated_at |
| `academic_student` | id (UUID PK), user (OTO->User), branch (FK->Branch), date_joined, guardian_name, guardian_phone, guardian_email, is_active, created_at, updated_at |
| `academic_enrollment_period` | id (UUID PK), branch (FK->Branch), program (FK->Program), sub_program (FK->SubProgram), class_type, class_period, title, start_date, end_date, is_active, created_at, updated_at |
| `academic_enrollment` | id (UUID PK), student (FK->Student), enrolled_class (FK->Class), enrolled_at, status, enrollment_number (unique), pending_code, verification_status, rejection_reason, transferred_from (self-FK), remarks, created_at, updated_at. Constraint: unique_active_enrollment_per_student_class |
| `academic_enrollment_payment` | id (UUID PK), enrollment (OTO->Enrollment), amount (Decimal), payment_method, transaction_reference, bank_name, transfer_reference, attachment (FileField), payment_date, status, verified_by (FK->User), verified_at, verification_notes, created_at, updated_at |
| `academic_attendance_session` | id (UUID PK), enrolled_class (FK->Class), session_date, topic, recorded_by (FK->User), created_at, updated_at. Constraint: unique_session_per_class_per_day |
| `academic_attendance_record` | id (UUID PK), attendance_session (FK->AttendanceSession), enrollment (FK->Enrollment), status, remarks, created_at, updated_at. Constraint: unique_record_per_session_per_enrollment |
| `academic_staff_attendance_session` | id (UUID PK), branch (FK->Branch), date, status (DRAFT/PUBLISHED), notes, created_by (FK->User), is_active, created_at, updated_at |
| `academic_staff_attendance_record` | id (UUID PK), session (FK->StaffAttendanceSession, CASCADE), staff_member (FK->User), status, notes, created_at, updated_at. Constraint: unique per session |
| `academic_learning_milestone` | id (UUID PK), sub_program (FK->SubProgram), scope_class (FK->Class, nullable), title, description, is_active, created_at, updated_at. Constraint: unique per scope |
| `academic_learning_material` | id (UUID PK), sub_program (FK->SubProgram), title, description, file (FileField, validated), material_type, uploaded_by (FK->User), is_active, created_at, updated_at |
| `academic_student_progress` | id (UUID PK), enrollment (FK->Enrollment), milestone (FK->LearningMilestone), status, completed_at, remarks, updated_by (FK->User), created_at, updated_at. Constraint: unique per enrollment+milestone |
| `academic_certificate` | id (UUID PK), sub_program (OTO->SubProgram), title, background (ImageField, validated), institute_logo (ImageField, validated), signature (ImageField, validated), body_text, is_active, created_at, updated_at |
| `academic_student_certificate` | id (UUID PK), student (FK->Student), certificate (FK->Certificate), sub_program (FK->SubProgram), certificate_number (unique), issued_by (FK->User), issued_at, created_at, updated_at. Constraint: unique per student+sub_program |
| `academic_branch_transfer_request` | id (UUID PK), enrollment (FK->Enrollment, CASCADE), from_branch (FK->Branch), to_branch (FK->Branch), target_class (FK->Class), requested_by (FK->User), approved_by (FK->User, nullable), status, rejection_reason, created_at, approved_at |

### events

| Table | Fields |
|---|---|
| `events_event` | id (UUID PK), branch (FK->Branch, nullable), title, description, banner (ImageField), location, event_type, start_datetime, end_datetime, visibility, status, registration_enabled, registration_mode, registration_deadline, payment_required, registration_fee (Decimal), capacity, enrolled_count, youtube_live_url, is_active, created_at, updated_at |
| `events_tournament_category` | id (UUID PK), name (unique), code (unique), description, is_active, created_at, updated_at |
| `events_tournament` | id (UUID PK), event (OTO->Event), category (FK->TournamentCategory), max_teams, prize_pool, is_closed, created_at, updated_at |
| `events_tournament_team` | id (UUID PK), tournament (FK->Tournament), registration (FK->EventRegistration, nullable), team_name, organization, coach_name, contact_email, contact_phone, wins, losses, draws, points, created_at, updated_at. Constraint: unique team name per tournament |
| `events_match` | id (UUID PK), tournament (FK->Tournament, CASCADE), round, scheduled_at, started_at, completed_at, winning_side (FK->MatchSide, nullable), status, created_at, updated_at |
| `events_match_side` | id (UUID PK), match (FK->Match, CASCADE), side (SIDE_A/SIDE_B), score, created_at, updated_at |
| `events_match_participant` | id (UUID PK), match_side (FK->MatchSide, CASCADE), tournament_team (FK->TournamentTeam), created_at |
| `events_workshop` | id (UUID PK), event (OTO->Event), instructor (FK->User), duration_minutes, level, price (Decimal), created_at, updated_at |
| `events_event_registration` | id (UUID PK), event (FK->Event, CASCADE), student (FK->Student, nullable), public_full_name, public_email, public_phone, public_organization, registration_status, payment_status, registered_at, approved_at, cancelled_at, created_at, updated_at. Constraints: unique event+student, unique event+public_email |
| `events_event_payment` | id (UUID PK), registration (OTO->EventRegistration), amount (Decimal), payment_method, transaction_reference, bank_name, attachment, payment_date, status, verified_by (FK->User), verified_at, verification_notes, created_at, updated_at |

### store

| Table | Fields |
|---|---|
| `store_product_category` | id (UUID PK), name (unique), description, is_active, created_at, updated_at |
| `store_product` | id (UUID PK), category (FK->ProductCategory), name, slug (unique), short_description, description, sku (unique), barcode, price (Decimal, >0 constraint), weight, is_active, archived_at, created_at, updated_at |
| `store_product_image` | id (UUID PK), product (FK->Product, CASCADE), image (ImageField), alt_text, is_primary, display_order, created_at |
| `store_branch_inventory` | id (UUID PK), branch (FK->Branch, CASCADE), product (FK->Product, CASCADE), quantity (>=0), minimum_quantity, created_at, updated_at |
| `store_shopping_cart` | id (UUID PK), user (FK->User, nullable), session_key, expires_at, created_at, updated_at |
| `store_shopping_cart_item` | id (UUID PK), cart (FK->ShoppingCart, CASCADE), product (FK->Product, CASCADE), branch (FK->Branch, CASCADE), quantity (>0), created_at |
| `store_pending_order` | id (UUID PK), user (FK->User, nullable), branch (FK->Branch), payment_reference, subtotal (Decimal), total (Decimal), guest_name, guest_email, guest_phone, expires_at, created_at |
| `store_pending_order_item` | id (UUID PK), pending_order (FK->PendingOrder, CASCADE), product (FK->Product, CASCADE), quantity, unit_price (Decimal), subtotal (Decimal) |
| `store_payment` | id (UUID PK), pending_order (OTO->PendingOrder, CASCADE), amount (Decimal), payment_method, transaction_reference, bank_name, attachment, status, payment_date, verified_by (FK->User), verified_at, verification_notes, created_at, updated_at |
| `store_order` | id (UUID PK), order_number (unique), user (FK->User, nullable), branch (FK->Branch), payment_reference, subtotal (Decimal), total (Decimal), status, paid_at, completed_at, cancelled_at, refunded_at, guest_name, guest_email, guest_phone, created_at |
| `store_order_item` | id (UUID PK), order (FK->Order, CASCADE), product (FK->Product, CASCADE), product_name, sku, quantity, unit_price (Decimal), subtotal (Decimal) |
| `store_order_status_history` | id (UUID PK), order (FK->Order, CASCADE), previous_status, new_status, changed_by (FK->User), changed_at, notes |

---

## 4. API Endpoints

### 4.1 Accounts (`/api/v1/accounts/`)

| Method | URL | View | Permission |
|---|---|---|---|
| POST | `login/` | LoginView | AllowAny |
| POST | `logout/` | LogoutView | IsAuthenticated |
| POST | `token/refresh/` | TokenRefreshView | AllowAny |
| POST | `email-verification/request/` | EmailVerificationRequestView | IsAuthenticated |
| POST | `email-verification/verify/` | EmailVerificationVerifyView | IsAuthenticated |
| POST | `device-verification/request/` | DeviceVerificationRequestView | IsAuthenticated |
| POST | `device-verification/verify/` | DeviceVerificationVerifyView | IsAuthenticated |
| POST | `password/forgot/` | ForgotPasswordView | AllowAny |
| POST | `password/reset/` | ResetPasswordView | AllowAny |
| POST | `password/change/` | ChangePasswordView | IsAuthenticated |
| POST | `public/email-verification/request/` | PublicEmailVerificationRequestView | AllowAny |
| POST | `public/email-verification/verify/` | PublicEmailVerificationVerifyView | AllowAny |
| GET | `users/` | UserListView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `users/staff/` | CreateStaffUserView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `users/branch-managers/` | CreateBranchManagerView | IsAuthenticated, IsSuperAdmin |
| GET/PATCH | `users/<uuid:pk>/` | UserDetailView | IsAuthenticated |
| POST | `users/<uuid:pk>/activate/` | UserActivateView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `users/<uuid:pk>/deactivate/` | UserDeactivateView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `users/<uuid:pk>/archive/` | UserArchiveView | IsAuthenticated, IsSuperAdmin |
| GET/POST | `branches/` | BranchListCreateView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/with-manager/` | BranchWithManagerView | IsAuthenticated, IsSuperAdmin |
| GET/PATCH | `branches/<uuid:pk>/` | BranchDetailView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/<uuid:pk>/assign-manager/` | BranchAssignManagerView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/<uuid:pk>/change-manager/` | BranchChangeManagerView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/<uuid:pk>/activate/` | BranchActivateView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/<uuid:pk>/deactivate/` | BranchDeactivateView | IsAuthenticated, IsSuperAdmin |
| POST | `branches/<uuid:pk>/archive/` | BranchArchiveView | IsAuthenticated, IsSuperAdmin |
| GET/POST | `assignments/` | AssignmentListCreateView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `assignments/transfer/` | AssignmentTransferView | IsAuthenticated, IsSuperAdminOrBranchManager |
| PATCH/DELETE | `assignments/<uuid:pk>/` | AssignmentDetailView | IsAuthenticated, IsSuperAdminOrBranchManager |
| POST | `assignments/<uuid:pk>/make-primary/` | AssignmentMakePrimaryView | IsAuthenticated, IsSuperAdminOrBranchManager |
| GET | `devices/` | DeviceListView | IsAuthenticated |
| GET/DELETE | `devices/<uuid:pk>/` | DeviceDetailView | IsAuthenticated |
| POST | `devices/revoke-all/` | DeviceRevokeAllView | IsAuthenticated |

### 4.2 Audit (`/api/v1/audit/`)

| Method | URL | View | Permission |
|---|---|---|---|
| GET | `/` | AuditLogViewSet (list) | IsSuperAdmin |
| GET | `/{id}/` | AuditLogViewSet (retrieve) | IsSuperAdmin |

### 4.3 Bank Accounts (`/api/v1/bank-accounts/`)

| Method | URL | View | Permission |
|---|---|---|---|
| GET | `bank-accounts/` | BankAccountViewSet (list) | BankAccountPermission (any auth) |
| POST | `bank-accounts/` | BankAccountViewSet (create) | BankAccountPermission (super admin) |
| GET | `bank-accounts/{id}/` | BankAccountViewSet (retrieve) | BankAccountPermission (any auth) |
| PUT/PATCH/DELETE | `bank-accounts/{id}/` | BankAccountViewSet | BankAccountPermission (super admin) |

### 4.4 CMS (`/api/v1/cms/`)

**Public (AllowAny):**
| Method | URL | View |
|---|---|---|
| GET | `hero-banners/` | PublicHeroBannerListView |
| GET | `news/` | PublicNewsArticleListView |
| GET | `news/<slug:slug>/` | PublicNewsArticleDetailView |
| GET | `partners/` | PublicPartnerListView |
| GET | `about/` | PublicAboutUsListView |
| GET | `about/<slug:slug>/` | PublicAboutUsDetailView |
| GET | `faqs/` | PublicFAQListView |
| POST | `contact-requests/` | PublicCreateContactRequestView |
| GET | `stats/` | PublicPlatformStatsView |
| GET | `map-nodes/` | PublicMapNodeListView |
| GET | `gallery/` | PublicGalleryListView |
| GET | `gallery/<uuid:pk>/` | PublicGalleryDetailView |

**Admin (IsCMSStaff = Super Admin only):**
| Method | URL | View |
|---|---|---|
| GET/POST | `admin/hero-banners/` | AdminHeroBannerListCreateView |
| GET/PUT/DELETE | `admin/hero-banners/<uuid:pk>/` | AdminHeroBannerRetrieveUpdateDestroyView |
| GET/POST | `admin/news/` | AdminNewsArticleListCreateView |
| GET/PUT/DELETE | `admin/news/<uuid:pk>/` | AdminNewsArticleRetrieveUpdateDestroyView |
| GET/POST | `admin/partners/` | AdminPartnerListCreateView |
| GET/PUT/DELETE | `admin/partners/<uuid:pk>/` | AdminPartnerRetrieveUpdateDestroyView |
| GET/POST | `admin/about/` | AdminAboutUsListCreateView |
| GET/PUT/DELETE | `admin/about/<uuid:pk>/` | AdminAboutUsRetrieveUpdateDestroyView |
| GET/POST | `admin/faqs/` | AdminFAQListCreateView |
| GET/PUT/DELETE | `admin/faqs/<uuid:pk>/` | AdminFAQRetrieveUpdateDestroyView |
| GET | `admin/contact-requests/` | AdminContactRequestListCreateView |
| GET/PUT/DELETE | `admin/contact-requests/<uuid:pk>/` | AdminContactRequestRetrieveUpdateDestroyView |
| GET/POST | `admin/map-nodes/` | AdminMapNodeListCreateView |
| GET/PUT/DELETE | `admin/map-nodes/<uuid:pk>/` | AdminMapNodeRetrieveUpdateDestroyView |
| GET/POST | `admin/gallery/` | AdminGalleryListCreateView |
| GET/PUT/DELETE | `admin/gallery/<uuid:pk>/` | AdminGalleryRetrieveUpdateDestroyView |

### 4.5 Academic (`/api/v1/academic/`)

**Programs & Classes:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `programs/` | IsAcademicAdmin |
| GET/PUT/DELETE | `programs/<uuid:pk>/` | IsAcademicAdmin |
| POST | `programs/<uuid:pk>/activate/` | IsAcademicAdmin |
| POST | `programs/<uuid:pk>/deactivate/` | IsAcademicAdmin |
| GET/POST | `sub-programs/` | IsAcademicAdmin |
| GET/PUT/DELETE | `sub-programs/<uuid:pk>/` | IsAcademicAdmin |
| GET/POST | `classes/` | IsAcademicAdmin |
| GET/PUT/DELETE | `classes/<uuid:pk>/` | IsAcademicAdmin |
| POST | `classes/<uuid:pk>/assign-instructor/` | IsAcademicAdmin |

**Students & Admissions:**
| Method | URL | Permission |
|---|---|---|
| POST | `admissions/` | IsAcademicStaff |
| GET | `students/` | IsAcademicAdmin |
| GET | `students/search/` | IsAcademicAdmin |
| GET/PUT | `students/<uuid:pk>/` | IsAcademicAdmin |
| POST | `students/<uuid:pk>/activate/` | IsAcademicAdmin |
| POST | `students/<uuid:pk>/deactivate/` | IsAcademicAdmin |

**Enrollments:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `enrollment-periods/` | IsAcademicAdmin |
| GET/POST | `enrollments/` | IsAcademicAdmin |
| POST | `enrollments/online/` | AllowAny |
| GET | `enrollments/<uuid:pk>/` | IsAcademicAdmin |
| POST | `enrollments/<uuid:pk>/cancel/` | IsAcademicAdmin |

**Payments:**
| Method | URL | Permission |
|---|---|---|
| POST | `payments/` | IsAuthenticated |
| GET | `payments/verification-queue/` | IsAcademicAdmin |
| POST | `payments/<uuid:pk>/verify/` | IsAcademicAdmin |
| POST | `payments/<uuid:pk>/under-review/` | IsAcademicAdmin |
| POST | `payments/<uuid:pk>/reject/` | IsAcademicAdmin |

**Staff Attendance:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `staff-attendance/sessions/` | IsAttendanceManager |
| GET/PUT | `staff-attendance/sessions/<uuid:pk>/` | IsAttendanceManager |
| POST | `staff-attendance/sessions/<uuid:pk>/publish/` | IsAttendanceManager |

**Attendance:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `attendance/sessions/` | CanManageAttendance |
| GET/PUT | `attendance/sessions/<uuid:pk>/` | CanManageAttendance |
| POST | `attendance/records/` | CanManageAttendance |

**Learning Materials & Progress:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `learning-milestones/` | CanManageProgress |
| POST | `student-progress/` | CanManageProgress |
| GET | `student-progress/` | CanViewReport |
| GET/POST | `learning-materials/` | CanManageMaterial |
| GET/PUT/DELETE | `learning-materials/<uuid:pk>/` | CanManageMaterial |
| GET | `learning-materials/<uuid:pk>/download/` | CanViewMaterial |

**Certificates:**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `certificate-templates/` | CanManageCertificate |
| GET/PUT/DELETE | `certificate-templates/<uuid:pk>/` | CanManageCertificate |
| POST | `student-certificates/issue/` | CanManageCertificate |
| GET | `student-certificates/` | CanViewCertificate |
| GET | `certificates/verify/<str:number>/` | AllowAny |

**Transfers:**
| Method | URL | Permission |
|---|---|---|
| POST | `transfers/request/` | IsAcademicAdmin |
| GET | `transfers/` | IsAcademicAdmin |
| POST | `transfers/<uuid:pk>/approve/` | IsAcademicAdmin |
| POST | `transfers/<uuid:pk>/reject/` | IsAcademicAdmin |

**Reports:**
| Method | URL | Permission |
|---|---|---|
| GET | `reports/students/<uuid:pk>/academic/` | CanViewReport |
| GET | `reports/students/<uuid:pk>/enrollments/` | CanViewReport |
| GET | `reports/students/<uuid:pk>/attendance/` | CanViewReport |
| GET | `reports/students/<uuid:pk>/progress/` | CanViewReport |
| GET | `reports/students/<uuid:pk>/certificates/` | CanViewReport |
| GET | `reports/classes/<uuid:pk>/` | CanViewStaffReport |

### 4.6 Events (`/api/v1/events/`)

**Public (AllowAny):**
| Method | URL |
|---|---|
| GET | `events/` |
| GET | `events/<uuid:pk>/` |
| GET | `events/live/` |
| GET | `events/upcoming/` |
| GET | `events/past/` |
| GET | `events/tournaments/` |
| GET | `events/tournaments/<uuid:pk>/` |
| GET | `events/tournaments/<uuid:pk>/standings/` |
| GET | `events/workshops/` |
| GET | `events/workshops/<uuid:pk>/` |

**User (IsAuthenticated):**
| Method | URL |
|---|---|
| POST | `events/<uuid:pk>/register/` |
| GET | `my-registrations/` |
| POST | `my-registrations/<uuid:pk>/cancel/` |

**Admin (IsEventStaff/IsEventRegistrationStaff/IsEventStaffOrInstructor):**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `admin/events/` | IsEventStaff |
| GET/PUT/DELETE | `admin/events/<uuid:pk>/` | IsEventStaff |
| POST | `admin/events/<uuid:pk>/publish/` | IsEventStaff |
| POST | `admin/events/<uuid:pk>/unpublish/` | IsEventStaff |
| POST | `admin/events/<uuid:pk>/activate/` | IsEventStaff |
| POST | `admin/events/<uuid:pk>/deactivate/` | IsEventStaff |
| GET/POST | `admin/tournaments/` | IsEventStaff |
| GET/POST | `admin/tournament-categories/` | IsEventStaff |
| GET/POST | `admin/tournament-teams/` | IsEventStaff |
| GET/POST | `admin/matches/` | IsEventStaff |
| POST | `admin/matches/<uuid:pk>/assign-team/` | IsEventStaff |
| POST | `admin/matches/<uuid:pk>/remove-team/` | IsEventStaff |
| POST | `admin/matches/<uuid:pk>/record-scores/` | IsEventStaff |
| POST | `admin/matches/<uuid:pk>/complete/` | IsEventStaff |
| GET/POST | `admin/workshops/` | IsEventStaffOrInstructor |
| GET/PUT/DELETE | `admin/workshops/<uuid:pk>/` | IsEventStaffOrInstructor |
| GET | `admin/registrations/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/approve/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/reject/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/cancel/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/convert-to-team/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/pay/cash/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/verify-payment/` | IsEventRegistrationStaff |
| POST | `admin/registrations/<uuid:pk>/reject-payment/` | IsEventRegistrationStaff |

### 4.7 Store (`/api/v1/store/`)

**Public (AllowAny):**
| Method | URL |
|---|---|
| GET | `categories/` |
| GET | `categories/<uuid:pk>/` |
| GET | `products/` |
| GET | `products/<uuid:pk>/` |
| GET | `inventory/` |
| GET | `inventory/availability/<uuid:product_pk>/` |

**User (IsAuthenticated):**
| Method | URL |
|---|---|
| GET | `cart/` |
| POST | `cart/items/` |
| PATCH | `cart/items/<uuid:pk>/` |
| POST | `cart/items/<uuid:pk>/remove/` |
| POST | `cart/clear/` |
| POST | `cart/checkout/` |
| GET | `pending-orders/<uuid:pk>/` |
| POST | `pending-orders/<uuid:pending_order_pk>/evidence/` |
| GET | `orders/` |
| GET | `orders/<uuid:pk>/` |

**Admin (IsStoreStaff / IsStoreInventoryStaff):**
| Method | URL | Permission |
|---|---|---|
| GET/POST | `admin/categories/` | IsStoreStaff |
| GET/PUT/DELETE | `admin/categories/<uuid:pk>/` | IsStoreStaff |
| GET/POST | `admin/products/` | IsStoreStaff |
| GET/PUT/DELETE | `admin/products/<uuid:pk>/` | IsStoreStaff |
| POST | `admin/products/<uuid:pk>/archive/` | IsStoreStaff |
| POST | `admin/products/<uuid:pk>/restore/` | IsStoreStaff |
| POST | `admin/products/<uuid:pk>/activate/` | IsStoreStaff |
| POST | `admin/products/<uuid:pk>/deactivate/` | IsStoreStaff |
| POST | `admin/products/<uuid:product_pk>/images/` | IsStoreStaff |
| GET/POST | `admin/inventory/` | IsStoreInventoryStaff |
| POST | `admin/inventory/<uuid:pk>/add/` | IsStoreInventoryStaff |
| POST | `admin/inventory/<uuid:pk>/reduce/` | IsStoreInventoryStaff |
| POST | `admin/inventory/<uuid:pk>/correct/` | IsStoreInventoryStaff |
| POST | `admin/inventory/transfer/` | IsStoreInventoryStaff |
| GET | `admin/payments/` | IsStoreStaff |
| POST | `admin/pending-orders/<uuid:pending_order_pk>/verify/` | IsStoreStaff |
| POST | `admin/pending-orders/<uuid:pending_order_pk>/reject/` | IsStoreStaff |
| POST | `admin/pending-orders/<uuid:pending_order_pk>/cash/` | IsStoreStaff |
| GET | `admin/orders/` | IsStoreStaff |
| POST | `admin/orders/<uuid:pk>/status/` | IsStoreStaff |
| GET | `admin/reports/products/` | IsStoreStaff |
| GET | `admin/reports/inventory/` | IsStoreStaff |
| GET | `admin/reports/low-stock/` | IsStoreStaff |
| GET | `admin/reports/sales/` | IsStoreStaff |
| GET | `admin/reports/orders/` | IsStoreStaff |
| GET | `admin/reports/branch-sales/` | IsStoreStaff |

### 4.8 Schema & Docs

| Method | URL | View | Permission |
|---|---|---|---|
| GET | `api/schema/` | SpectacularAPIView | AllowAny |
| GET | `api/docs/swagger/` | SpectacularSwaggerView | AllowAny |
| GET | `api/docs/redoc/` | SpectacularRedocView | AllowAny |

### 4.9 Django Admin

| URL | View |
|---|---|
| `admin/` | Django admin site |

---

## 5. Authentication Methods

**Mechanism:** JWT via `djangorestframework-simplejwt`
- Access token lifetime: configurable via `JWT_ACCESS_TOKEN_MINUTES` (default: 60 min)
- Refresh token lifetime: configurable via `JWT_REFRESH_TOKEN_DAYS` (default: 1 day)
- Token rotation: enabled (`ROTATE_REFRESH_TOKENS = True`)
- Blacklist after rotation: enabled (`BLACKLIST_AFTER_ROTATION = True`)
- Update last login: enabled (`UPDATE_LAST_LOGIN = True`)
- Auth header: `Bearer <token>`

**Auth Flows:**
1. **Login**: `POST /api/v1/accounts/login/` — email + password, returns JWT pair
2. **Email verification** (if `AUTH_REQUIRE_EMAIL_VERIFICATION=True`): OTP sent to email
3. **Device verification** (if `AUTH_REQUIRE_DEVICE_VERIFICATION=True`): OTP for new devices
4. **Password reset**: OTP-based via `password/forgot/` + `password/reset/`
5. **Token refresh**: `POST /api/v1/accounts/token/refresh/` — rotates tokens
6. **Logout**: `POST /api/v1/accounts/logout/` — blacklists refresh token

**Custom User Model:** `accounts.User` (`settings.AUTH_USER_MODEL`), extends `AbstractBaseUser` + `PermissionsMixin`, email as username field.

**OTP System:** bcrypt-hashed codes in `OTPChallenge` model. Configurable length (default 6), expiry (10 min), max attempts (3), max resends (3).

**DRF Default Auth:**
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}
```

---

## 6. Permission Classes

### accounts/permissions/`__init__.py`

| Class | Description |
|---|---|
| `IsSuperAdmin` | Active Super Admin assignment required |
| `IsBranchManager` | Active Branch Manager assignment required |
| `IsInstructor` | Active Instructor assignment required |
| `IsSecretary` | Active Secretary assignment required |
| `IsSuperAdminOrBranchManager` | Super Admin OR Branch Manager |
| `IsSelfOrSuperAdmin` | Resource owner or Super Admin |

### accounts/permissions/`roles.py` (helpers)

| Function | Description |
|---|---|
| `get_active_roles(user)` | Returns set of active role strings |
| `get_active_branch_ids(user)` | Returns set of branch UUIDs |
| `user_is_super_admin(user)` | Check Super Admin role |
| `user_is_branch_manager(user)` | Check Branch Manager role |
| `user_is_instructor(user)` | Check Instructor role |
| `user_is_secretary(user)` | Check Secretary role |
| `user_is_student(user)` | Check Student role |
| `user_manages_branch(user, branch_id)` | Super Admin or manages specific branch |

### shared/audit

| Class | Description |
|---|---|
| `IsSuperAdmin` | Super Admin only (reuses accounts helper) |

### shared/bank

| Class | Description |
|---|---|
| `BankAccountPermission` | SAFE_METHODS: any authenticated; write: Super Admin only |

### cms

| Class | Description |
|---|---|
| `IsCMSStaff` | Super Admin only |

### academic/permissions/

| Class | Description |
|---|---|
| `IsAcademicAdmin` | Super Admin or Branch Manager |
| `IsAcademicStaff` | Super Admin, Branch Manager, or Secretary |
| `CanManageAttendance` | SA/BM/Instructor (branch-scoped) |
| `CanManageProgress` | SA/BM/Instructor (branch-scoped) |
| `CanViewReport` | SA/BM/Secretary/Student (scoped) |
| `CanViewStaffReport` | SA/BM/Secretary/Instructor (scoped) |
| `CanManageCertificate` | SA/BM/Secretary |
| `CanViewCertificate` | SA/BM/Secretary/Student (scoped) |
| `IsAttendanceManager` | SA/BM (branch-scoped) |
| `CanManageMaterial` | SA/BM/Instructor (branch-scoped) |
| `CanViewMaterial` | SA/BM/Instructor/Student (scoped) |

### events

| Class | Description |
|---|---|
| `IsEventStaff` | Super Admin or Branch Manager (branch-scoped) |
| `IsEventRegistrationStaff` | SA, BM, or Secretary |
| `IsEventStaffOrInstructor` | SA/BM (scoped) or Instructor (read-only, no write) |

### store

| Class | Description |
|---|---|
| `IsStoreStaff` | Super Admin only |
| `IsStoreInventoryStaff` | Super Admin or Branch Manager (branch-scoped) |

---

## 7. Middleware

| Order | Middleware |
|---|---|
| 1 | `corsheaders.middleware.CorsMiddleware` |
| 2 | `django.middleware.security.SecurityMiddleware` |
| 3 | `whitenoise.middleware.WhiteNoiseMiddleware` (conditional) |
| 4 | `django.contrib.sessions.middleware.SessionMiddleware` |
| 5 | `django.middleware.common.CommonMiddleware` |
| 6 | `django.middleware.csrf.CsrfViewMiddleware` |
| 7 | `django.contrib.auth.middleware.AuthenticationMiddleware` |
| 8 | `django.contrib.messages.middleware.MessageMiddleware` |
| 9 | `django.middleware.clickjacking.XFrameOptionsMiddleware` |

**CORS:**
- `DEBUG=True`: `CORS_ALLOW_ALL_ORIGINS = True`
- `DEBUG=False`: `CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS`
- `CORS_ALLOW_CREDENTIALS = True`

---

## 8. Celery Tasks

Celery is **not installed** (not in requirements.txt). No `celery.py` config exists.

Defined task functions (designed for Celery):
- `cleanup_otp_challenges()` — Marks expired OTP challenges as used
- `cleanup_trusted_devices()` — Deactivates expired trusted devices

---

## 9. File Upload Handling

### Upload Locations

| Path Prefix | Models |
|---|---|
| `profiles/` | User.profile_picture |
| `cms/hero_banners/` | HeroBanner.image |
| `cms/news/` | NewsArticle.image |
| `cms/partners/` | Partner.image |
| `cms/contact_requests/{ticket}/` | ContactRequest.attachment |
| `cms/map_nodes/` | MapNode.image |
| `cms/gallery/` | Gallery.image |
| `events/banners/` | Event.banner |
| `payment_attachments/` | EnrollmentPayment.attachment, EventPayment.attachment, StorePayment.attachment |
| `store/products/` | ProductImage.image |
| `academic/learning_materials/` | LearningMaterial.file |
| `academic/certificates/bg/` | Certificate.background |
| `academic/certificates/logo/` | Certificate.institute_logo |
| `academic/certificates/sig/` | Certificate.signature |

### Validation

**Global:** `FILE_UPLOAD_MAX_MEMORY_SIZE = 2MB`, `DATA_UPLOAD_MAX_MEMORY_SIZE = 2MB`, `FILE_UPLOAD_PERMISSIONS = 0o644`

**Shared Validator** (`apps/shared/validators.py` — `UploadedFileValidator`):
- Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.pdf`, `.doc`, `.docx`
- MIME validation via `python-magic` (reads first 2048 bytes)
- Max file size: 10 MB
- Filename sanitization (removes directory separators, dangerous characters, truncates to 100 chars)

**Applied explicitly on:** `LearningMaterial.file`, `Certificate.background`, `Certificate.institute_logo`, `Certificate.signature`
**Not applied on:** CMS images, payment attachments, event banners, product images, profile pictures

---

## 10. Third-Party Integrations

| Service | Library | Purpose | Configuration |
|---|---|---|---|
| JWT Auth | `djangorestframework-simplejwt` | Token auth | `SIMPLE_JWT` settings |
| Email | `django-anymail` (optional) | SendGrid, MailerSend, Postmark, Brevo, Mailgun, SES | `EMAIL_PROVIDER` env var |
| CORS | `django-cors-headers` | Cross-origin | `CORS_ALLOW_ALL_ORIGINS` / `CORS_ALLOWED_ORIGINS` |
| DRF | `djangorestframework` | REST API | `REST_FRAMEWORK` settings |
| Schema | `drf-spectacular` | OpenAPI | `/api/schema/`, `/api/docs/swagger/`, `/api/docs/redoc/` |
| Filtering | `django-filter` | Query filtering | `DEFAULT_FILTER_BACKENDS` |
| Static files | `whitenoise` (optional) | Static serving | Dynamic middleware |
| Cloud storage | `django-storages` (optional) | S3/Azure/GCS | `STATIC_BACKEND`/`MEDIA_BACKEND` |
| MIME detection | `python-magic` | File validation | Used in validators |
| Image processing | `Pillow` | Image support | ImageField |
| PDF generation | `reportlab` | PDF reports | Reports |
| HTTP client | `requests` | External API calls | General purpose |

**No external payment gateway** — manual verification only (cash/bank transfer/mobile money/cheque).

---

## 11. Environment Configuration

### Settings File
- `config/settings.py` (581 lines) with `config/integrations/email.py`

### Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DEBUG` | `False` | Debug mode |
| `SECRET_KEY` | (required) | Django secret key |
| `ALLOWED_HOSTS` | `*` | Allowed hosts |
| `FRONTEND_ORIGINS` | (required in prod) | CORS + CSRF origins |
| `DB_ENGINE` | `sqlite` | sqlite/postgresql |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `True` | Email verification required |
| `AUTH_REQUIRE_DEVICE_VERIFICATION` | `True` | Device verification required |
| `AUTH_OTP_LENGTH` | `6` | OTP code length |
| `AUTH_OTP_EXPIRY_MINUTES` | `10` | OTP expiry |
| `AUTH_MAX_OTP_ATTEMPTS` | `3` | Max OTP verify attempts |
| `AUTH_MAX_OTP_RESENDS` | `3` | Max OTP resends |
| `AUTH_MAX_LOGIN_ATTEMPTS` | `5` | Max login attempts |
| `AUTH_ACCOUNT_LOCK_MINUTES` | `15` | Account lock duration |
| `JWT_ACCESS_TOKEN_MINUTES` | `60` | JWT access TTL |
| `JWT_REFRESH_TOKEN_DAYS` | `1` | JWT refresh TTL |
| `EMAIL_PROVIDER` | `console` | Email backend |
| `STATIC_BACKEND` | `local` | Static storage backend |
| `MEDIA_BACKEND` | `local` | Media storage backend |

### Throttle Rates (configurable via env)

| Variable | Default |
|---|---|
| `THROTTLE_LOGIN` | `10/min` |
| `THROTTLE_OTP_SEND` | `5/hour` |
| `THROTTLE_OTP_VERIFY` | `5/min` |
| `THROTTLE_EMAIL_VERIFY` | `10/min` |
| `THROTTLE_VERIFICATION_RESEND` | `5/hour` |
| `THROTTLE_FORGOT_PASSWORD` | `3/min` |
| `THROTTLE_RESET_PASSWORD` | `5/min` |

---

## 12. Installed Packages

```
Django>=5.0,<6.0
psycopg2-binary
django-environ
Pillow
python-magic
djangorestframework
djangorestframework-simplejwt
drf-spectacular
django-anymail
django-cors-headers
django-filter
whitenoise
django-storages
requests
reportlab>=4.0,<5.0
```

---

## Summary

| Category | Count |
|---|---|
| Django apps | 6 |
| Models | 50+ |
| API endpoints | 270+ |
| Permission classes | 25+ |
| Middleware classes | 9 |
| Celery tasks (defined) | 2 |
| File upload fields | 17+ |
| Upload validators | 1 (partially applied) |
| Installed packages | 15 |
