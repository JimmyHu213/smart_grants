# Sprint 2 Evaluation: Pipeline -- Companies, Applications, User Dashboard

**Date:** 02/04/2026
**Evaluator:** Claude Opus 4.6 (Automated)
**Verdict:** FAIL

---

## Contract Checklist

| # | Contract Item | Status | Evidence |
|---|--------------|--------|----------|
| 1 | Admin can create a company with all profile fields | PASS | Tested: created "Arafura Voyages Pty Ltd" with name, ABN, jurisdiction, industry, indigenous ownership, turnover, trading duration, employee count, description. Toast confirmed. |
| 2 | Admin can create a user account linked to a company | PARTIAL | Dialog exists and form works. First attempt rejected by Supabase email validation (`.com.au` domain), second attempt hit Supabase rate limit. Code logic is sound (admin client + fallback path), but no `SUPABASE_SERVICE_ROLE_KEY` configured so it falls back to `signUp` which triggers confirmation emails and rate limits. |
| 3 | Admin can view all companies and their users at /admin/companies | PASS | Page loads with summary cards (Total Companies, Total Users, Active Applications), table with all columns (Company, ABN, Jurisdiction, Industry, Indigenous, Users, Applications, Actions). |
| 4 | Admin can edit company details | PASS | Edit dialog opens pre-populated with all fields. Save action works (tested via code review -- uses same `idSchema` but company IDs are UUIDs). |
| 5 | Admin can assign a grant to a company's pipeline | FAIL | **Critical bug:** Zod validation in `createApplicationSchema` requires `grantId: z.string().uuid()` but all 20 seed grants have short IDs (`g01`-`g20`), not UUIDs. Error displayed: "Invalid grant ID". Grant assignment is completely broken. |
| 6 | Admin can change application status through all workflow stages | BLOCKED | Cannot test -- no applications can be created due to item 5 failure. Code review shows proper `Select` with `getAllowedNextStatuses()` filtering. |
| 7 | Status transitions are validated (no arbitrary backwards movement) | PASS (code) | `ALLOWED_TRANSITIONS` map in `validation.ts` correctly enforces forward-only movement: NOT_STARTED -> RESEARCHING -> DRAFTING -> SUBMITTED -> UNDER_REVIEW -> APPROVED/REJECTED -> CLOSED. Any status can go to CLOSED. `isValidStatusTransition()` function is well-implemented. |
| 8 | Pipeline view at /admin/pipeline with filtering | PASS (UI) | Page renders with 8 status summary cards (clickable filters), status dropdown, company dropdown, table with proper columns. URL-based filtering via searchParams. |
| 9 | Application cards show grant name, company, status, deadline, checklist progress | PASS (code) | Table columns include Grant (name + jurisdiction badge), Company, Status (badge), Deadline (with clock icon), Documents (X / Y format), Notes, Change Status. |
| 10 | Admin can edit application notes | BLOCKED | Cannot test due to item 5. Code review shows proper Dialog with Textarea, save action calls `updateApplicationNotes` with Zod validation. |
| 11 | User dashboard at /dashboard shows only their company's applications | PASS (code) | Data scoped by `user.companyId` on line 69: `where: { companyId: user.companyId }`. Layout requires auth. Verified admin sees "No Company Linked" since admin has no companyId. |
| 12 | User sees grant name, status, deadline, checklist progress per application | PASS (code) | Dashboard cards show grant name, jurisdiction badge, status badge, amount, next process step, deadline, document progress (X / Y with progress bar). |
| 13 | User cannot access other companies' data | PASS | Dashboard layout checks auth. Data query is scoped to `user.companyId`. No cross-company data leakage path in code. |
| 14 | All server actions have Zod input validation | PASS | Every server action (`createGrant`, `updateGrant`, `deleteGrant`, `createCompany`, `updateCompany`, `createUserAccount`, `createApplication`, `updateApplicationStatus`, `updateApplicationNotes`) uses `.safeParse()` with Zod schemas. |
| 15 | Environment variables validated (no `!` assertions) | PASS | `src/lib/env.ts` uses Zod schema validation at import time. No `process.env.X!` patterns found anywhere in `src/`. `supabase/client.ts` and `db.ts` use runtime checks with thrown errors. |
| 16 | Accessibility issues from Sprint 1 fixed | PASS | `aria-hidden="true"` on decorative icons, `sr-only` on action column headers, `aria-label` on dropdown triggers (e.g. "Actions for Arafura Voyages Pty Ltd"), `aria-label` on filter selects, `role="progressbar"` with `aria-valuenow/min/max` on dashboard progress bars, proper `Label`+`htmlFor` pairings. |
| 17 | Code follows Australian English conventions | MOSTLY | "serialisedCompanies", "serialisedGrants", "organisation" in checkbox label, "programme" in descriptions. Good adherence. |
| 18 | All code compiles without TypeScript errors | PASS | `npx tsc --noEmit` completed with zero errors. |

---

## Critical Bugs

### 1. Grant ID / UUID Mismatch (Severity: BLOCKING)

**Location:** `src/lib/validation.ts` lines 83, 92, 140

The `idSchema`, `createApplicationSchema.grantId`, and `updateApplicationStatusSchema.applicationId` all require `z.string().uuid()`. However, all 20 seed grants in the database have short IDs (`g01` through `g20`), NOT UUIDs. This was confirmed via direct database query.

**Impact:**
- Grant assignment to pipeline is completely broken ("Invalid grant ID")
- Grant editing fails silently (the `idSchema.safeParse(id)` rejects `g04` etc.)
- Grant deletion fails silently
- The entire application pipeline feature is non-functional

**Root cause:** The Prisma schema uses `@id @default(uuid())` but the seed data was inserted with explicit short IDs (likely via a migration or direct SQL). The Zod validation was then written assuming all IDs would be UUIDs.

**Fix:** Either change `idSchema` to `z.string().min(1)` (accept any non-empty string ID), or re-seed the database with proper UUIDs.

### 2. Grant Edit Fails Silently (Severity: HIGH)

When clicking "Save Changes" on the grant edit dialog, nothing happens -- no toast, no error, dialog stays open. The `updateGrant` server action returns `{ success: false, error: "Invalid grant ID" }` but the client code should show the error via `toast.error()`. The silent failure suggests the server action may be throwing before returning, or there's a timing issue with the dialog state.

---

## Minor Issues

### 3. Pluralisation Bug on Companies Page

**Location:** `src/app/(admin)/admin/companies/companies-page-client.tsx` line 53

Text shows "1 companyy registered" instead of "1 company registered". The template `company{companies.length !== 1 ? "ies" : "y"}` appends "y" to "company" for singular, resulting in "companyy".

### 4. Company Select Shows UUID in Assign Dialog

When selecting a company in the "Assign Grant to Pipeline" dialog, the trigger displays the raw UUID (`e8f8ee5b-b4a4-439f-b43f-47680cd4f450`) instead of the company name after selection.

### 5. ABN Validation Regex Logic

**Location:** `src/lib/validation.ts` line 57

The refine callback `val.replace(/\s/g, "") ? val : ""` is confusing. It checks if val without spaces is truthy, then tests the original val (with spaces). The intent appears to skip validation for empty strings, but the `!val ||` at the start already handles this. The logic works incidentally but is fragile.

### 6. No Test Coverage

Zero test files found in the project (no `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`). No testing framework configured.

### 7. Missing SUPABASE_SERVICE_ROLE_KEY

The service role key is not configured in `.env`, so user creation falls back to `supabase.auth.signUp()` which sends confirmation emails and is subject to rate limiting. The admin user creation flow should use the admin API to avoid this.

---

## Scoring

| Criterion | Weight | Score (1-10) | Evidence |
|-----------|--------|-------------|----------|
| **Functionality** | 30% | **4** | Company CRUD works. Pipeline assignment is completely broken due to ID/UUID mismatch. Grant editing/deletion broken for seed data. Status transitions, notes editing untestable. Dashboard renders but no data to display. Core Sprint 2 deliverable (pipeline) is non-functional. |
| **Code Quality** | 20% | **7** | Zod validation on all actions (even if overly strict). Auth checks via `requireAdmin()` on every server action. Clean TypeScript with zero compilation errors. Proper error handling patterns. Status transition logic well-designed. The UUID-only ID validation is the quality problem. |
| **Design Quality** | 25% | **7** | Clean, consistent dark theme. Professional table layouts with summary cards. Pipeline page has status filter cards with click-to-filter. Dashboard has progress bars with proper ARIA. Navigation is clear. "companyy" pluralisation bug is cosmetic. Company UUID display in select is a UX issue. |
| **Originality** | 10% | **7** | Status summary cards as clickable filters is a nice touch. Pipeline view with inline status change dropdown is practical. Dashboard shows "next step" from process steps mapping. Progress bars for document checklists add value. Not just CRUD -- thoughtful admin workflow. |
| **Test Coverage** | 15% | **1** | Zero tests. No testing framework. No unit tests, integration tests, or e2e tests. |

### Weighted Total

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Functionality | 30% | 4 | 1.20 |
| Code Quality | 20% | 7 | 1.40 |
| Design Quality | 25% | 7 | 1.75 |
| Originality | 10% | 7 | 0.70 |
| Test Coverage | 15% | 1 | 0.15 |
| **TOTAL** | **100%** | | **5.20** |

---

## Verdict: FAIL

### Reasons for Failure

1. **Functionality score (4) is below the hard floor of 7.** The pipeline -- the core Sprint 2 deliverable -- is completely non-functional due to the grant ID/UUID validation mismatch. No grants can be assigned, edited, or deleted.

2. **Weighted total (5.20) is below the minimum of 7.0.**

3. **Test Coverage score (1) is below the minimum per-criterion score of 6.**

### What Would Be Needed to Pass

1. **Fix the ID validation mismatch** -- change `idSchema` to `z.string().min(1)` or re-seed with UUID grant IDs. This single fix would unblock pipeline assignment, grant editing, and grant deletion.

2. **Fix the pluralisation bug** -- trivial fix on line 53 of `companies-page-client.tsx`.

3. **Fix the company UUID display** in the assign dialog select trigger.

4. **Add basic test coverage** -- at minimum, unit tests for `isValidStatusTransition()`, `getAllowedNextStatuses()`, and Zod schema validation. Integration tests for server actions.

5. **Configure SUPABASE_SERVICE_ROLE_KEY** for reliable user creation.

### What Worked Well

- Company CRUD is fully functional with all profile fields
- Zod validation architecture is comprehensive (just overly restrictive on ID format)
- Auth checks are consistent across all server actions
- Status transition logic is well-designed with clear allowed transitions
- UI design is clean and professional with good accessibility
- Environment variable validation via Zod is properly implemented
- TypeScript compiles cleanly with no errors
- Australian English conventions are followed
- Dashboard data scoping is correctly implemented
