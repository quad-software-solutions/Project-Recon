# OWASP Top 10 Security Report

**Phase:** 2
**Date:** 2026-07-17
**Objective:** Review the backend against the OWASP Top 10 (2021).

---

## Summary

| OWASP Category | Findings | Critical | High | Medium | Low | Info |
|---|---|---|---|---|---|---|
| A01 — Broken Access Control | 10 | 3 | 3 | 3 | 1 | 0 |
| A02 — Cryptographic Failures | 8 | 1 | 4 | 3 | 0 | 1 |
| A03 — Injection | 4 | 0 | 0 | 2 | 0 | 2 |
| A04 — Insecure Design | 6 | 1 | 2 | 3 | 0 | 0 |
| A05 — Security Misconfiguration | 8 | 0 | 3 | 3 | 2 | 0 |
| A06 — Vulnerable & Outdated Components | 3 | 1 | 0 | 2 | 0 | 0 |
| A07 — Identification & Authentication Failures | 10 | 1 | 4 | 4 | 1 | 0 |
| A08 — Software & Data Integrity Failures | 4 | 0 | 1 | 2 | 0 | 1 |
| A09 — Security Logging & Monitoring Failures | 7 | 1 | 3 | 3 | 1 | 0 |
| A10 — Server-Side Request Forgery (SSRF) | 5 | 0 | 0 | 2 | 2 | 1 |
| **Total** | **65** | **8** | **20** | **27** | **7** | **5** |

---

## A01 — Broken Access Control

### A01-01 — Academic Views Lack Branch-Scoped Object-Level Permissions (Critical)

**Severity:** Critical

**Category:** A01 — Broken Access Control

**Description:** Multiple academic views use `IsAcademicStaff` or `IsAcademicAdmin` which only check role membership, never verifying that the user's branch covers the objects being accessed. Service functions return unfiltered querysets (all objects across all branches).

**Risk:** Complete violation of multi-tenant branch isolation. Branch Managers have implicit global admin access.

**Affected Files:**
- `apps/academic/views/student.py:56` — `list_students()` returns ALL students
- `apps/academic/views/enrollment.py:57` — `list_enrollments()` returns ALL enrollments
- `apps/academic/views/payment.py:35` — `list_payments()` returns ALL payments
- `apps/academic/views/transfer_views.py:80` — `list_transfer_requests()` returns ALL transfers
- `apps/academic/views/class_view.py:44` — `list_classes()` returns ALL classes
- `apps/academic/views/program.py:40` — `list_programs()` returns ALL programs
- `apps/academic/services/student_service.py`, `enrollment_service.py`, `payment_service.py`, `transfer_service.py`, `class_service.py`, `program_service.py` — no branch filter parameters

**Exploitation Scenario:** Branch Manager of Branch A calls `GET /api/v1/academic/students/` and sees all students across all branches, including personal data (email, phone, guardian info).

**Recommendation:** Apply branch-scoped filtering to all list endpoints. Add `branch_ids` parameter to service functions. Pass `get_active_branch_ids(request.user)` from the view.

---

### A01-02 — Events Payment List Lacks Branch Scoping (Critical)

**Severity:** Critical

**Category:** A01 — Broken Access Control

**Description:** `AdminPaymentListView` uses `IsEventRegistrationStaff` (permits Branch Managers) but `list_payments()` does not filter by branch.

**Affected Files:**
- `apps/events/api/views/payment.py:126-133`
- `apps/events/services/event_payment_service.py:31-52`

**Exploitation Scenario:** A Branch Manager sees payment evidence (bank names, transaction references, amounts) for events in other branches.

**Recommendation:** Add `branch_ids` parameter to `list_payments()` and pass `get_active_branch_ids(request.user)` for non-Super Admins.

---

### A01-03 — Bank Account Details Exposed to Unauthenticated Users (Critical)

**Severity:** Critical

**Category:** A01 — Broken Access Control

**Description:** `BankAccountPermission` allows `SAFE_METHODS` for anyone, including unauthenticated users. Any visitor can list all bank account details.

**Affected Files:**
- `apps/shared/bank/api/views.py:41-44`
- `apps/shared/bank/api/permissions.py:6-14`

**Exploitation Scenario:** An attacker calls `GET /api/v1/bank-accounts/` and retrieves all account numbers, bank names, SWIFT codes.

**Recommendation:** Restrict `SAFE_METHODS` to authenticated users. Consider Super Admin only.

---

### A01-04 — Privilege Escalation via CreateStaffUserView Role Enumeration (High)

**Severity:** High

**Category:** A01 — Broken Access Control

**Description:** `CreateStaffUserView` accepts a `role` field from `Roles.choices` including `SUPER_ADMIN`. A Branch Manager with `IsSuperAdminOrBranchManager` could attempt to create a user with any role.

**Affected Files:**
- `apps/accounts/views/user.py:107-139`
- `apps/accounts/serializers/user.py:81-104`

**Exploitation Scenario:** Branch Manager sends `POST /api/v1/accounts/users/staff/` with `{"role": "super_admin"}`.

**Recommendation:** Use separate serializers with restricted role choices for Branch Manager vs Super Admin flows.

---

### A01-05 — Online Enrollment Without Authentication (High)

**Severity:** High

**Category:** A01 — Broken Access Control

**Description:** `OnlineEnrollmentView` has `permission_classes = []` — completely open with no rate limiting or CAPTCHA.

**Affected Files:**
- `apps/academic/views/enrollment.py:115-141`
- `apps/academic/services/enrollment_service.py`

**Exploitation Scenario:** An attacker scripts 10,000 enrollments, creating thousands of User/Student records and exhausting database resources.

**Recommendation:** Add throttling and CAPTCHA to the online enrollment endpoint.

---

### A01-06 — Public Event Registration Without Rate Limiting (High)

**Severity:** High

**Category:** A01 — Broken Access Control

**Description:** `EventRegisterView` uses `AllowAny` with no throttle class.

**Affected Files:**
- `apps/events/api/views/registration.py:32-71`

**Exploitation Scenario:** Attacker mass-registers for a tournament with limited capacity, blocking legitimate registrations.

**Recommendation:** Add rate limiting and email verification for public registrations.

---

### A01-07 — Weak Authorization on Guest Pending Order Lookup (Medium)

**Severity:** Medium

**Category:** A01 — Broken Access Control

**Description:** `PendingOrderDetailView` uses `AllowAny` and identifies guests via `X-Session-Key` header or `guest_email`.

**Affected Files:**
- `apps/store/api/views/checkout.py:70-98`

**Exploitation Scenario:** Attacker enumerates session keys or guesses guest emails to view pending orders and payment evidence.

**Recommendation:** Use unique, non-guessable tokens for guest order access.

---

### A01-08 — Assignment Creation Accepts Unrestricted Roles (Medium)

**Severity:** Medium

**Category:** A01 — Broken Access Control

**Description:** `AssignmentListCreateView` accepts all `Roles.choices`, allowing a Branch Manager to create another Branch Manager for their branch.

**Affected Files:**
- `apps/accounts/views/assignment.py:54-102`

**Exploitation Scenario:** A Branch Manager creates additional Branch Managers for their branch without Super Admin authorization.

**Recommendation:** Validate that non-Super Admin users cannot assign roles equal to or higher than their own.

---

### A01-09 — Admin ContactRequest List Publicly Accessible (Low)

**Severity:** Low

**Category:** A01 — Broken Access Control

**Description:** `PublicCreateContactRequestView` allows anyone to create contact requests with no rate limiting.

**Affected Files:**
- `apps/cms/api/views/contact_request.py:21-37, 40-55`

**Exploitation Scenario:** Attacker submits thousands of fake contact requests, filling the admin queue.

**Recommendation:** Add throttling/CAPTCHA to the public contact request endpoint.

---

### A01-10 — Store Admin Restricted to Super Admin Only (Low)

**Severity:** Low

**Category:** A01 — Broken Access Control

**Description:** `IsStoreStaff` only allows Super Admin access to store admin endpoints, while `IsStoreInventoryStaff` allows Branch Managers for inventory. No Branch Manager access for products, orders, or categories.

**Affected Files:**
- `apps/store/api/permissions.py:10-18`

**Recommendation:** If Branch Managers should manage their branch's store, extend `IsStoreStaff` with branch-scoped filtering. If intentional, document clearly.

---

## A02 — Cryptographic Failures

### A02-01 — Hardcoded Placeholder SECRET_KEY (Critical)

**Severity:** Critical

**Category:** A02 — Cryptographic Failures

**Description:** `.env` contains `SECRET_KEY=django-insecure-placeholder-for-local-dev-must-be-long-enough` — the well-known Django placeholder.

**Risk:** If deployed to production, all cryptographic operations (JWT signing, sessions, CSRF, password reset tokens) are compromised.

**Affected Files:**
- `.env:2`

**Exploitation Scenario:** Attacker forges JWT tokens, session cookies, and password reset links for any account.

**Recommendation:** Generate a strong unique SECRET_KEY for production. Add deployment validation rejecting the placeholder.

---

### A02-02 — JWT Refresh Token 7-Day Lifetime (High)

**Severity:** High

**Category:** A02 — Cryptographic Failures

**Description:** `.env` sets `JWT_REFRESH_TOKEN_DAYS=7`. `TokenRefreshView` is `AllowAny` with no device fingerprint check.

**Affected Files:**
- `.env:19`
- `apps/accounts/views/auth.py:105-124`
- `config/settings.py:524`

**Exploitation Scenario:** Stolen refresh token provides a 7-day window to mint new access tokens.

**Recommendation:** Reduce to 1 day. Add device fingerprint verification on token refresh.

---

### A02-03 — OTP Sent in Plain Text via Email (High)

**Severity:** High

**Category:** A02 — Cryptographic Failures

**Description:** OTP codes are sent in plain text via email. Anyone who intercepts SMTP traffic or accesses the user's inbox can read the OTP.

**Affected Files:**
- `apps/accounts/services/otp_service.py:72-77`

**Exploitation Scenario:** Attacker with access to victim's email reads the OTP and completes password reset or verification.

**Recommendation:** Consider TOTP/HOTP. Ensure email transport uses TLS.

---

### A02-04 — DEBUG Mode Enabled (High)

**Severity:** High

**Category:** A02 — Cryptographic Failures (Information Exposure)

**Description:** `.env` sets `DEBUG=True`. If deployed, error pages expose full tracebacks, environment variables, and SECRET_KEY.

**Affected Files:**
- `.env:1`
- `config/settings.py:34`

**Exploitation Scenario:** Attacker triggers a 500 error and reads SECRET_KEY, DB credentials, and env vars from the traceback.

**Recommendation:** Set `DEBUG=False` in production. Add deployment guard.

---

### A02-05 — CORS Allows All Origins When DEBUG is True (Medium)

**Severity:** Medium

**Category:** A02 — Cryptographic Failures

**Description:** `CORS_ALLOW_ALL_ORIGINS = True` when `DEBUG=True`. Any website can make cross-origin requests.

**Affected Files:**
- `config/settings.py:50`

**Exploitation Scenario:** Attacker hosts a malicious site making authenticated API calls on behalf of logged-in users.

**Recommendation:** Add deployment validation forcing `CORS_ALLOW_ALL_ORIGINS = False` when `DEBUG = False`.

---

### A02-06 — Password Reset OTP Iterates Over All Users (Medium)

**Severity:** Medium

**Category:** A02 — Cryptographic Failures

**Description:** `reset_password()` iterates ALL active PASSWORD_RESET OTP challenges across all users with no user identifier.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:331-340`
- `apps/accounts/serializers/auth.py:106-110`

**Exploitation Scenario:** Any valid OTP resets some user's password — the API cannot validate which user the caller intended.

**Recommendation:** Tie reset flow to a specific user via email field. Filter OTPChallenge by user before matching.

---

### A02-07 — Account Lockout Not Enforced (Medium)

**Severity:** Medium

**Category:** A02 — Cryptographic Failures

**Description:** `AUTH_MAX_LOGIN_ATTEMPTS` and `AUTH_ACCOUNT_LOCK_MINUTES` are defined but never read. The `login()` function does not track or limit failed attempts.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:78-128`
- `config/settings.py:573-574`

**Exploitation Scenario:** Unlimited brute-force password guessing with no lockout.

**Recommendation:** Implement account lockout — increment a `failed_login_attempts` counter and lock the account after threshold.

---

### A02-08 — No HSTS When Not in DEBUG — Proxy Trust Risk (Info)

**Severity:** Informational

**Category:** A02 — Cryptographic Failures

**Description:** `SECURE_HSTS_SECONDS` is set (good), but `SECURE_PROXY_SSL_HEADER` relies on `X-Forwarded-Proto` which can be spoofed if the reverse proxy doesn't strip it.

**Affected Files:**
- `config/settings.py:549-562`

**Recommendation:** Verify the production reverse proxy strips `X-Forwarded-Proto` from incoming requests.

---

## A03 — Injection

### A03-01 — Stored XSS Potential in CMS Content Fields (Medium)

**Severity:** Medium

**Category:** A03 — Injection

**Description:** CMS models store HTML content fields (News content, About content, FAQ answers, descriptions). The backend does not sanitize. If the frontend renders without sanitization, stored XSS is possible.

**Affected Files:**
- `apps/cms/models/news.py` (content field)
- `apps/cms/models/about.py` (content field)
- `apps/cms/models/faq.py` (answer field)
- `apps/cms/models/partner.py` (description field)
- `apps/cms/models/hero_banner.py` (description field)

**Exploitation Scenario:** Super Admin injects malicious JS in a news article. When users view the public page, the script executes, stealing session cookies.

**Recommendation:** Implement CSP headers. Sanitize HTML input with a library like `bleach` or enforce sanitization on the frontend.

---

### A03-02 — File Upload Path Traversal Risk (Medium)

**Severity:** Medium

**Category:** A03 — Injection

**Description:** Several `ImageField` and `FileField` fields use `upload_to` with static prefixes but no filename sanitization on the field level.

**Affected Files:**
- `apps/accounts/models/user.py:57` (profile_picture)
- `apps/cms/models/gallery.py` (image)
- `apps/store/models/product_image.py` (image)

**Exploitation Scenario:** Uploaded file with crafted filename `../../../etc/passwd` could overwrite system files if combined with misconfigured storage.

**Recommendation:** Use UUID-based filenames for all uploads. Strip path traversal characters.

---

### A03-03 — No SQL Injection Found (Info)

**Severity:** Informational

**Category:** A03 — Injection

**Description:** Codebase consistently uses Django ORM with parameterized queries. No raw SQL or string interpolation in queries.

**Recommendation:** Maintain this standard. Add `bandit` or `semgrep` scanning in CI.

---

### A03-04 — No Command Injection Found (Info)

**Severity:** Informational

**Category:** A03 — Injection

**Description:** No use of `os.system()`, `subprocess.Popen()`, `exec()`, `eval()`, or `pickle.load()` in application code.

**Recommendation:** Maintain this standard. Add pre-commit hooks blocking these calls.

---

## A04 — Insecure Design

### A04-01 — Rate Limiting Throttles Are Non-Functional (Critical)

**Severity:** Critical

**Category:** A04 — Insecure Design

**Description:** Custom throttle classes define scopes (`anon_login`, `anon_forgot_password`, `anon_reset_password`, `user_otp_request`, `user_otp_verify`) that don't match any key in `DEFAULT_THROTTLE_RATES`. All throttles silently pass through.

**Affected Files:**
- `apps/accounts/api/throttles.py:4-21`
- `config/settings.py:511-519`
- `apps/accounts/views/auth.py:54, 170, 189, 220, 241, 266, 282`

**Exploitation Scenario:** Brute-force login, OTP, and password reset at unlimited speed.

**Recommendation:** Align throttle scope names with keys in `DEFAULT_THROTTLE_RATES`.

---

### A04-02 — Password Reset OTP Enables Cross-User Brute-Force (High)

**Severity:** High

**Category:** A04 — Insecure Design

**Description:** `reset_password()` queries ALL active PASSWORD_RESET OTP challenges across all users with no user filter.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:331-343`

**Exploitation Scenario:** Attacker submits OTP guesses that belong to other users' password reset flows.

**Recommendation:** Scope the OTP query to the identified user via email.

---

### A04-03 — Bank Account Details Exposed to All Authenticated Users (High)

**Severity:** High

**Category:** A04 — Insecure Design

**Description:** `BankAccountPermission` allows any authenticated user to list bank account records.

**Affected Files:**
- `apps/shared/bank/api/permissions.py:6-14`
- `apps/shared/bank/api/views.py:41-44`

**Exploitation Scenario:** Any authenticated user enumerates all bank accounts with financial details.

**Recommendation:** Restrict to Super Admins for all methods.

---

### A04-04 — Academic Views Lack Branch Scoping (Medium)

**Severity:** Medium

**Category:** A04 — Insecure Design

**Description:** `IsAcademicStaff` allows Super Admin, Branch Manager, or Secretary to access all records regardless of branch.

**Affected Files:**
- `apps/academic/views/student.py:51-57`
- `apps/academic/views/enrollment.py:56-57`
- `apps/academic/permissions/__init__.py:26-39`

**Exploitation Scenario:** Branch Manager of Branch A views students from Branch B, violating privacy requirements.

**Recommendation:** Inject branch scoping into querysets using `get_active_branch_ids()`.

---

### A04-05 — OpenAPI Schema / Swagger UI Publicly Accessible (Medium)

**Severity:** Medium

**Category:** A04 — Insecure Design

**Description:** `/api/schema/`, `/api/docs/swagger/`, and `/api/docs/redoc/` are accessible without authentication, exposing the full API surface.

**Affected Files:**
- `config/urls.py:16-18`

**Exploitation Scenario:** Attacker uses documented API to craft targeted attacks.

**Recommendation:** Restrict schema/docs access in production or serve only in DEBUG mode.

---

### A04-06 — Guest Checkout Session-Key Authentication Is Weak (Medium)

**Severity:** Medium

**Category:** A04 — Insecure Design

**Description:** Store cart/checkout identifies unauthenticated guests via `X-Session-Key` header. Predictable keys enable cart hijacking.

**Affected Files:**
- `apps/store/api/views/shopping_cart.py:23-29`
- `apps/store/api/views/checkout.py:16-22`

**Exploitation Scenario:** Attacker reuses observed session key to hijack guest's cart and checkout.

**Recommendation:** Use cryptographically random session keys. Implement TTL for guest sessions.

---

## A05 — Security Misconfiguration

### A05-01 — DEBUG Mode Enabled in .env File (High)

**Severity:** High

**Category:** A05 — Security Misconfiguration

**Description:** `.env` sets `DEBUG=True`. If deployed, error pages leak full settings including SECRET_KEY.

**Affected Files:**
- `.env:1`
- `config/settings.py:34`

**Exploitation Scenario:** Trigger 500 error → read SECRET_KEY, DB credentials, API keys.

**Recommendation:** Set `DEBUG=False` in production. Validate with `python manage.py check --deploy`.

---

### A05-02 — ALLOWED_HOSTS Accepts Wildcard (`*`) (High)

**Severity:** High

**Category:** A05 — Security Misconfiguration

**Description:** If `ALLOWED_HOSTS` env var is not set, defaults to `*`. Exposes app to Host header injection.

**Affected Files:**
- `config/settings.py:36-38`

**Exploitation Scenario:** Cache poisoning, password reset poisoning with attacker-controlled Host header.

**Recommendation:** Add validation guard rejecting `*` when not in DEBUG.

---

### A05-03 — CORS Allows All Origins in Debug Mode (Medium)

**Severity:** Medium

**Category:** A05 — Security Misconfiguration

**Description:** `CORS_ALLOW_ALL_ORIGINS = True` when `DEBUG=True`.

**Affected Files:**
- `config/settings.py:49-50`

**Exploitation Scenario:** Any website can make cross-origin requests if deployed with DEBUG=True.

**Recommendation:** Remove the `DEBUG` conditional or force `False` in production.

---

### A05-04 — Missing Content Security Policy (CSP) Header (Medium)

**Severity:** Medium

**Category:** A05 — Security Misconfiguration

**Description:** No CSP header is set. If XSS is achieved, browsers will execute injected scripts without restriction.

**Affected Files:**
- `config/settings.py:114-124`

**Exploitation Scenario:** Injected script exfiltrates session tokens or performs keylogging.

**Recommendation:** Add `django-csp` middleware with a strict CSP policy.

---

### A05-05 — PaymentEvidenceSubmitView Uses Wrong Permission (High)

**Severity:** High

**Category:** A05 — Security Misconfiguration

**Description:** `PaymentEvidenceSubmitView` uses `IsAdminUser` (checks `is_staff` Django flag) instead of role-based permission.

**Affected Files:**
- `apps/store/api/views/payment.py:26`

**Exploitation Scenario:** User accidentally granted `is_staff=True` gains payment evidence submission access.

**Recommendation:** Replace with `IsStoreStaff`.

---

### A05-06 — Management Command Exposes Password to Console (Medium)

**Severity:** Medium

**Category:** A05 — Security Misconfiguration

**Description:** `create_super_admin` prints the password to stdout in the success message.

**Affected Files:**
- `apps/accounts/management/commands/create_super_admin.py:38`

**Exploitation Scenario:** Password visible in CI/CD logs or shared terminal.

**Recommendation:** Remove password from output message.

---

### A05-07 — S3 Static File Overwrite Enabled (Low)

**Severity:** Low

**Category:** A05 — Security Misconfiguration

**Description:** `AWS_S3_FILE_OVERWRITE = True` is hardcoded.

**Affected Files:**
- `config/settings.py:265`

**Exploitation Scenario:** If attacker gains write access to S3, can overwrite static files (JS/CSS) with malicious versions.

**Recommendation:** Default to `False`, make configurable.

---

### A05-08 — Django Admin Interface Exposed Without IP Restriction (Low)

**Severity:** Low

**Category:** A05 — Security Misconfiguration

**Description:** Django admin at `/admin/` has no additional access controls beyond authentication.

**Affected Files:**
- `config/urls.py:8`

**Recommendation:** Restrict admin access by IP or rename the admin URL.

---

## A06 — Vulnerable & Outdated Components

### A06-01 — No Version Pinning on Critical Dependencies (Critical)

**Severity:** Critical

**Category:** A06 — Vulnerable & Outdated Components

**Description:** Most packages in `requirements.txt` are unpinned or use loose ranges. No lockfile exists.

**Affected Files:**
- `requirements.txt` (all 15 packages)

**Risk:** Non-deterministic builds, silent introduction of regressions, unknown CVE exposure.

**Recommendation:** Pin exact versions, use lockfile, run `pip-audit` in CI.

---

### A06-02 — `psycopg2-binary` Used Instead of `psycopg2` (Medium)

**Severity:** Medium

**Category:** A06 — Vulnerable & Outdated Components

**Description:** `psycopg2-binary` is for development only. The bundled libpq may not receive security patches.

**Affected Files:**
- `requirements.txt:2`

**Recommendation:** Use `psycopg2` in production.

---

### A06-03 — Unpinned Django Version Range Allows Unpatched Versions (Medium)

**Severity:** Medium

**Category:** A06 — Vulnerable & Outdated Components

**Description:** `Django>=5.0,<6.0` allows any 5.x release without a lockfile. Installed version may lack latest security patches.

**Affected Files:**
- `requirements.txt:1`

**Recommendation:** Pin to specific minor/patch version with a minimum.

---

## A07 — Identification & Authentication Failures

### A07-01 — Throttle Scope Mismatch — Rate Limiting Broken (Critical)

**Severity:** Critical

**Category:** A07 — Identification & Authentication Failures

**Description:** Custom throttle scopes don't match any key in `DEFAULT_THROTTLE_RATES`. No rate limiting on login, OTP, or password reset endpoints.

**Affected Files:**
- `apps/accounts/api/throttles.py:4-21`
- `config/settings.py:511-519`
- `apps/accounts/views/auth.py:54, 170, 189, 220, 241, 266, 282`

**Exploitation Scenario:** 1000+ requests/minute per endpoint for brute-force.

**Recommendation:** Align scope names with rate keys.

---

### A07-02 — Failed Login Attempts Never Logged / Account Lockout Not Implemented (High)

**Severity:** High

**Category:** A07 — Identification & Authentication Failures

**Description:** `login()` raises `AuthenticationFailed` but never logs failures, never checks lockout, never increments attempt counter.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:78-128`
- `config/settings.py:573-574`

**Exploitation Scenario:** Billions of password guesses with no lockout and no forensic trail.

**Recommendation:** Track failed attempts, lock after threshold, log each failure.

---

### A07-03 — Password Reset OTP Is User-Agnostic (High)

**Severity:** High

**Category:** A07 — Identification & Authentication Failures

**Description:** `reset_password()` iterates ALL active PASSWORD_RESET OTPs across ALL users.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:331-357`
- `apps/accounts/serializers/auth.py:106-110`

**Recommendation:** Add email field. Filter by user before matching OTP.

---

### A07-04 — Token Refresh Endpoint Has No Throttle (High)

**Severity:** High

**Category:** A07 — Identification & Authentication Failures

**Description:** `TokenRefreshView` has `AllowAny` and no throttle classes.

**Affected Files:**
- `apps/accounts/views/auth.py:105-124`

**Exploitation Scenario:** Attacker with leaked refresh token rotates it indefinitely without being throttled.

**Recommendation:** Add `AnonRateThrottle` to `TokenRefreshView`.

---

### A07-05 — `create_super_admin` Bypasses Password Validation by Default (High)

**Severity:** High

**Category:** A07 — Identification & Authentication Failures

**Description:** `create_super_admin()` defaults `bypass_password_validation=True`.

**Affected Files:**
- `apps/accounts/services/user_service.py:99-136`

**Recommendation:** Default to `False`.

---

### A07-06 — Management Command Prints Password to Stdout (Medium)

**Severity:** Medium

**Category:** A07 — Identification & Authentication Failures

**Description:** `create_super_admin.py` echoes the password in the success message.

**Affected Files:**
- `apps/accounts/management/commands/create_super_admin.py:38`

**Recommendation:** Remove password from output.

---

### A07-07 — OTP Verification Reveals Whether Challenge Exists (Medium)

**Severity:** Medium

**Category:** A07 — Identification & Authentication Failures

**Description:** `otp_service.verify()` returns different messages for "no challenge found" vs "expired" vs "invalid code".

**Affected Files:**
- `apps/accounts/services/otp_service.py:95-119`

**Exploitation Scenario:** Enumerate active OTP challenges via error message differences.

**Recommendation:** Use a single generic error message for all failure cases.

---

### A07-08 — JWT Access Token Default Lifetime 60 Minutes (Medium)

**Severity:** Medium

**Category:** A07 — Identification & Authentication Failures

**Description:** Default fallback is 60 min if `.env` is missing.

**Affected Files:**
- `config/settings.py:522-529`

**Recommendation:** Reduce default to 15 minutes.

---

### A07-09 — Logout Does Not Invalidate All Sessions (Medium)

**Severity:** Medium

**Category:** A07 — Identification & Authentication Failures

**Description:** `logout()` blacklists a single refresh token. Multiple tokens remain valid.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:144-156`

**Recommendation:** Implement "logout all sessions" endpoint.

---

### A07-10 — Password Minimum Length Hard-Coded at 8 (Low)

**Severity:** Low

**Category:** A07 — Identification & Authentication Failures

**Description:** `min_length=8` is hard-coded in serializers instead of using a configurable setting.

**Affected Files:**
- `apps/accounts/serializers/auth.py:110, 117`

**Recommendation:** Read from a Django setting.

---

## A08 — Software & Data Integrity Failures

### A08-01 — All Dependencies Unpinned — No Supply-Chain Integrity (High)

**Severity:** High

**Category:** A08 — Software & Data Integrity Failures

**Description:** `requirements.txt` has loose ranges or no versions. No lockfile, no hash pinning.

**Affected Files:**
- `requirements.txt` (all lines)

**Exploitation Scenario:** Malicious release of any dependency installed automatically on `pip install`.

**Recommendation:** Pin exact versions, use lockfile with hashes.

---

### A08-02 — Password Visible in Process List (Medium)

**Severity:** Medium

**Category:** A08 — Software & Data Integrity Failures

**Description:** Management command echoes password to stdout.

**Affected Files:**
- `apps/accounts/management/commands/create_super_admin.py:23, 38`

**Recommendation:** Read password via stdin or env variable only.

---

### A08-03 — Default `bypass_password_validation` in Helper (Low)

**Severity:** Low

**Category:** A08 — Software & Data Integrity Failures

**Description:** `create_super_admin()` defaults to bypassing validation, undermining password strength guarantees.

**Affected Files:**
- `apps/accounts/services/user_service.py:104`

**Recommendation:** Flip default to `False`.

---

### A08-04 — No CI/CD Security Checks (Info)

**Severity:** Informational

**Category:** A08 — Software & Data Integrity Failures

**Description:** No SAST, dependency-scanning, or secret-detection steps visible in CI configuration.

**Recommendation:** Integrate `pip-audit`, `bandit`, and `truffleHog` scanning on every PR.

---

## A09 — Security Logging & Monitoring Failures

### A09-01 — Failed Authentication Attempts Never Logged (Critical)

**Severity:** Critical

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** `login()` raises `AuthenticationFailed` but never calls `log_action()` for failures.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:97-108`

**Exploitation Scenario:** Thousands of brute-force attempts with no audit trail for forensic investigation.

**Recommendation:** Log every failed login with actor (None), IP, user-agent, and reason.

---

### A09-02 — Audit Log Missing IP Address and User-Agent (High)

**Severity:** High

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** `log_action()` accepts `ip_address` and `user_agent` parameters but almost every call site omits them.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:127, 156, 172, 190, 215, 230, 263, 266, 282, 297, 314, 357, 390`
- `apps/accounts/services/user_service.py:94, 231, 249, 264, 270, 277, 284`

**Exploitation Scenario:** Investigators cannot link audit events to source IPs or devices.

**Recommendation:** Pass request metadata to all audit calls. Add middleware to extract IP/UA.

---

### A09-03 — Failed OTP Attempts Not Logged (High)

**Severity:** High

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** `reset_password()` only logs success. Failed OTP and validation errors are silent.

**Affected Files:**
- `apps/accounts/services/authentication_service.py:331-357`

**Recommendation:** Log failed OTP attempts with OTP hash prefix, IP, and user-agent.

---

### A09-04 — Account Status Transitions Not Always Logged (Medium)

**Severity:** Medium

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** While `activate_user()` and `deactivate_user()` log, the `login()` function changes account state without explicit audit for status transitions.

**Affected Files:**
- `apps/accounts/services/user_service.py:266-284`
- `apps/accounts/services/authentication_service.py:78-128`

**Recommendation:** Ensure every status transition is explicitly logged. Consider signal-based audit hooks.

---

### A09-05 — AuditLog `details` JSONField Un-sanitised (Medium)

**Severity:** Medium

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** `details` field accepts arbitrary JSON. Callers may inadvertently log sensitive data (PII, credentials) in the immutable audit trail.

**Affected Files:**
- `apps/shared/audit/models/audit_log.py:60`
- `apps/shared/audit/services.py:38-47`

**Exploitation Scenario:** Attacker with audit API read access extracts PII or credential material.

**Recommendation:** Add sanitisation layer stripping known sensitive keys.

---

### A09-06 — No Real-Time Alerting on Audit Events (Medium)

**Severity:** Medium

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** The audit system is purely append-only with no alerting thresholds.

**Exploitation Scenario:** Brute-force can run for hours without triggering any alert.

**Recommendation:** Integrate audit log with monitoring system (Sentry, ELK, Slack alerts) on high-severity thresholds.

---

### A09-07 — Free-Form `action` Strings Allow Log Inconsistency (Low)

**Severity:** Low

**Category:** A09 — Security Logging & Monitoring Failures

**Description:** `log_action()` accepts any string for `action`. Codebase uses mixed conventions (`"LOGIN"`, `"LOG"`, `"user.password_reset"`).

**Affected Files:**
- `apps/shared/audit/services.py:40`

**Recommendation:** Define an enum or constant class for all audit actions.

---

## A10 — Server-Side Request Forgery (SSRF)

### A10-01 — Multiple URLField Model Fields Accept Arbitrary URLs (Medium)

**Severity:** Medium

**Category:** A10 — Server-Side Request Forgery

**Description:** Six models store user-configurable URLs with no scheme restriction or IP block validation. Future server-side URL fetching would be vulnerable to SSRF.

**Affected Files:**
- `apps/cms/models/hero_banner.py:16` (video_url), `:18` (button_url)
- `apps/cms/models/news.py:19` (video_url), `:21` (button_url)
- `apps/cms/models/partner.py:17` (website_url)
- `apps/cms/models/gallery.py:22` (video_url)
- `apps/events/models/event.py:60` (youtube_live_url)

**Exploitation Scenario (future):** If a feature fetches these URLs server-side, attacker sets `video_url = "http://169.254.169.254/latest/meta-data/"` to exfiltrate cloud provider metadata.

**Recommendation:** Add model-level validators restricting to `https` scheme and blocking private/reserved IPs.

---

### A10-02 — Serializers Allow Arbitrary URL Schemes (Medium)

**Severity:** Medium

**Category:** A10 — Server-Side Request Forgery

**Description:** CMS admin serializers pass URL values through without custom `validate_*` methods.

**Affected Files:**
- `apps/cms/api/serializers/hero_banner.py`
- `apps/cms/api/serializers/news.py`
- `apps/cms/api/serializers/partner.py`
- `apps/cms/api/serializers/gallery.py`

**Recommendation:** Add serializer-level validation rejecting non-http(s) schemes and internal IPs.

---

### A10-03 — File Upload MIME Validation Weak for .docx (Low)

**Severity:** Low

**Category:** A10 — Server-Side Request Forgery

**Description:** `.docx` MIME check accepts `application/zip`, letting through crafted .zip files renamed to .docx.

**Affected Files:**
- `apps/shared/validators.py:10-42`

**Recommendation:** Use stricter check inspecting ZIP contents for Office Open XML signatures.

---

### A10-04 — S3 File Overwrite Enabled, Public-Read ACL (Low)

**Severity:** Low

**Category:** A10 — Server-Side Request Forgery

**Description:** `AWS_S3_FILE_OVERWRITE = True` and `AWS_DEFAULT_ACL = "public-read"`.

**Affected Files:**
- `config/settings.py:265-266`

**Recommendation:** Set `AWS_S3_FILE_OVERWRITE = False`. Restrict `public-read` ACL to static prefix only.

---

### A10-05 — CORS All Origins + Credentials in DEBUG (Info)

**Severity:** Informational

**Category:** A10 — SSRF (CORS)

**Description:** `CORS_ALLOW_ALL_ORIGINS = True` + `CORS_ALLOW_CREDENTIALS = True` when `DEBUG=True`.

**Affected Files:**
- `config/settings.py:49-55`

**Recommendation:** Add startup guard crashing if both `DEBUG=True` and `CORS_ALLOW_ALL_ORIGINS=True`.

---

## Top 10 Critical/High Remediation Priorities

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Fix throttle scope mismatch to enable rate limiting | Critical | A04/A07 |
| 2 | Implement account lockout on failed logins | Critical/High | A02/A07 |
| 3 | Log failed authentication attempts | Critical | A09 |
| 4 | Replace placeholder SECRET_KEY | Critical | A02 |
| 5 | Disable DEBUG in production | High | A02/A05 |
| 6 | Add branch-scoped isolation to academic views | Critical/High | A01 |
| 7 | Restrict bank account API to Super Admins | Critical | A01/A04 |
| 8 | Tie password reset to specific user (add email field) | Critical/High | A01/A02/A07 |
| 9 | Pin dependency versions + add lockfile | Critical | A06/A08 |
| 10 | Add device fingerprint/IP to audit log entries | High | A09 |
