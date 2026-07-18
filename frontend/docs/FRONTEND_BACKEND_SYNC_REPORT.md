# Frontend–Backend Sync Report

Living production-readiness report for Project-Recon. Backend is the source of truth; frontend-only changes. Last updated after Waves 1–4 on branch `manual-payment`.

---

## 1. Backend architecture snapshot

| Mount | App | Notes |
|-------|-----|--------|
| `/api/v1/accounts/` | accounts | Auth, users, branches, assignments, devices |
| `/api/v1/academic/` | academic | Programs → enrollments, payments, attendance, certificates, reports |
| `/api/v1/events/` | events | Events, tournaments, workshops, registrations, payments |
| `/api/v1/cms/` | cms | Hero, news, partners, FAQ, contact, gallery, map nodes, stats |
| `/api/v1/store/` | store | Catalog, cart, checkout, inventory, orders, reports |
| `/api/v1/audit/` | shared.audit | Super-admin audit log list/detail |
| `/api/v1/bank-accounts/` | shared.bank | Public list; SA mutate |

**Roles** (on `UserAssignment`): `super_admin`, `branch_manager`, `secretary`, `instructor`, `student`.

**No standalone payments app.** Manual verification lives in academic / events / store. Chapa package is a bytecode remnant (not mounted). Forum app is not installed.

---

## 2. API coverage matrix (summary)

| Domain | Status |
|--------|--------|
| Accounts auth/devices/password | Integrated; device trust UI added |
| Accounts users/branches/assignments | Integrated (admin) |
| Academic catalog + enrollment ops | Integrated |
| Academic payment verification | Integrated + `transfer_reference` UI |
| Academic reports (PDF) | Integrated |
| Events public + admin | Integrated; tournament reopen wired |
| Events convert-to-team | Integrated in RegistrationManager |
| CMS public + admin | Integrated |
| Store cart/checkout/admin | Integrated |
| Store reports (all 6) | Integrated in StoreDashboard Reports |
| Audit | Integrated (SA) |
| Bank accounts | Single client path (`academicApi` + thin store re-export) |

**Intentionally unused / N/A:** social login (no backend), wishlist/coupons/Stripe, forum, real-time notification inbox, change-email URL (serializer exists, no route).

---

## 3. Hidden backend features — disposition

| Feature | Disposition |
|---------|-------------|
| `transfer_reference` on enrollment payments | Wired in registration + secretary record form |
| Tournament `reopen/` | Button on closed tournaments |
| Device verification OTP | Account “Trust this browser” (admin + student) |
| Store `branch-sales` / `orders` reports | Added to Reports panel |
| Class split / enrollment move / subprogram switch | Already in secretary EnrollmentsPanel |
| Staff attendance draft→publish | Already in StaffAttendanceManager |

---

## 4. Features implemented (this sync)

### Wave 1 — Payment sync
- Public registration collects optional **Transfer Reference** and submits `transfer_reference`.
- Secretary payment record form includes `transfer_reference`.
- `formatApiError` expanded (401–429, timeouts, network) and applied to payment panels (academic, events, store).
- Removed fragile `fetchMyStudentProfileApi` (staff-only student list); student ID resolves via cache + certificates only.
- Student password change uses `PUT /accounts/password/change/` with `old_password`.

### Wave 2 — Honesty + dead code
- Deleted stub domains: `forum/`, `notification/`.
- Deleted orphans: `VideoLibrary.tsx`, `CMSBranding.tsx`.
- Removed dead `ActiveTab` values `community` / `consultancy`.
- `/reset-password` routes to existing ForgotPasswordPage.
- Gallery empty copy: “No gallery items published yet.”
- Bank list: `store/bank/api/bankAccountApi` re-exports `fetchBankAccountsApi`.

### Wave 3 — Gaps + permissions
- Store reports: Orders + Branches tabs.
- Tournament reopen action.
- Device trust OTP UI; clearer login message when device verification blocks sign-in.
- Manager nav: announcements / sponsors gated to CMS staff (SA), matching `IsCMSStaff`.

### Wave 4 — UX consistency
- Rolled `formatApiError` across major user-domain mutation panels.
- Student modules import shared `EmptyState` (duplicate file removed).
- Duplicate-click / submit disable already present on registration and walk-in.

---

## 5. Dashboard improvements by role

| Role | Notes |
|------|--------|
| Super Admin | Full store reports; CMS; audit; bank CRUD; device trust |
| Branch Manager | Inventory store; payments; events; walk-in; CMS edit nav hidden |
| Secretary | Payments + verification queue + event payments; enrollments |
| Instructor | Unchanged academic teaching surfaces |
| Student | Safer student-id resolution; device trust; password API fix |

---

## 6. Permission corrections

- Manager `announcements` → `canManageAnnouncements` (SA).
- Manager `sponsors` → `canManageCms` (SA).
- Store full vs inventory nav already matched `IsStoreStaff` / `IsStoreInventoryStaff`.

---

## 7. Error handling improvements

- Shared `formatApiError` covers common HTTP statuses + network/timeout.
- Payment verify/reject/load paths no longer silent-fail with empty catch where updated.
- HTTP client retains 30s timeout + JWT refresh.

---

## 8. Validation improvements

- Registration maps DRF field errors including `transfer_reference`.
- Non-cash still requires transaction reference **or** attachment (matches backend).
- Walk-in remains cash-only (backend-valid).

---

## 9. Communication improvements

- No new notification inbox (no backend).
- CMS news/announcements and contact requests remain the communication surface.
- Student Settings still documents device-local prefs only.

---

## 10–13. UI / performance / security

- Empty states: single shared component.
- Student ID resolution no longer N+1 lists all students.
- Device trust uses authenticated OTP endpoints; tokens still refresh via `/accounts/token/refresh/`.
- Role gates for CMS/store aligned with backend permission classes.

---

## 14–15. Dead / duplicate code removed

- `domains/forum/**`, `domains/notification/**`
- `VideoLibrary.tsx`, `CMSBranding.tsx`
- Student `EmptyState` duplicate
- Dual bank GET clients collapsed to one implementation

---

## 16. Risks

1. **Student without cache and without certificates** still cannot discover academic `student` UUID (no self student endpoint).
2. **Device verification on login** returns 403 without tokens; trusting a new device requires an already-authenticated session (backend design).
3. **Manager dashboards** that previously linked CMS admin sections will now hide those nav items for non-SA (correct, but UX change).

---

## 17. Recommendations

1. Backend: add `GET /academic/students/me/` (or include `student_id` on user detail) to eliminate localStorage student ID dependency — *frontend cannot invent this*.
2. Consider temporary token flow for first-time device verification at login if `AUTH_REQUIRE_DEVICE_VERIFICATION` is enabled in production.
3. Continue rolling `formatApiError` into remaining competition admin catch blocks opportunistically.

---

## 18. Production readiness checklist

| Area | Ready? | Notes |
|------|--------|-------|
| Accounts | Yes | Device trust + password change aligned |
| Academic | Yes | Payment refs + verification queues |
| Events | Yes | Reopen + convert-to-team + payments |
| CMS | Yes | Public + SA admin; gallery honest empty |
| Payments (domains) | Yes | Academic / events / store manual verify |
| Store | Yes | Reports complete for SA |
| No fake/mock production APIs | Yes | Forum/notification stubs removed |
| Permissions match backend | Yes | CMS/store gates corrected |
| Dead shell tabs | Yes | community/consultancy removed |
| N/A features not invented | Yes | See section 2 |

**Verdict:** Frontend is synchronized with the **existing** backend surface for Accounts, Academic, Events, CMS, payment workflows, and Store. Items that do not exist on the backend remain documented as N/A rather than mocked.
