# Sprint 3 Evaluation: Documents, AI Eligibility, Admin Dashboard, Password Change

**Evaluator:** Claude Opus 4.6 (Automated)
**Date:** 02/04/2026
**Sprint:** 3
**Branch:** main

---

## Contract Checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Admin and user can upload files (PDF, DOCX, PNG, JPG, up to 10MB) | BLOCKED | Upload UI exists in `document-manager.tsx` with correct ALLOWED_TYPES and MAX_SIZE. Client-side validation is correct. However, all server actions fail with 500 due to the `eligibilitySchema` export bug (see Critical Bug below). |
| 2 | Uploaded files stored in Supabase Storage | PARTIAL | Code correctly uses `supabase.storage.from("documents").uploadToSignedUrl()` in the client component and generates signed upload URLs server-side. Cannot verify end-to-end due to server action failure. |
| 3 | Documents listed with filename, size, date, uploader, checklist item link, download link | PASS (code) | `DocumentManager` component renders all required fields: `fileName`, `formatFileSize(doc.fileSize)`, `formatDate(doc.createdAt)`, uploader name/email, checklist item label with Link2 icon, and download button. Cannot verify in browser due to no applications existing. |
| 4 | Documents can be linked to specific checklist items | PASS (code) | Select dropdown for checklist items in upload form. Server validates checklist item belongs to grant via `grantChecklistItem.findFirst`. |
| 5 | Admin can delete documents | PASS (code) | `deleteDocument` action uses `requireAdmin()`, deletes from both Supabase Storage and database. Confirmation dialog rendered for admin only (`isAdmin && <AlertDialog>`). |
| 6 | Admin can trigger AI eligibility assessment | BLOCKED | Button exists in pipeline UI ("Assess" / "View"). Server action `runEligibilityAssessment` has correct auth check, prompt construction, and API call. BLOCKED by the `eligibilitySchema` export bug preventing any server action invocation. |
| 7 | AI returns structured result: score, per-criterion assessment, gaps, recommendations | PASS (code) | `eligibilitySchema` validates: `overallScore` (0-100), `criteria` array with name/status/explanation, `gaps` string array, `recommendations` string array, `summary` string. Uses Vercel AI SDK `generateText` with `Output.object`. |
| 8 | Eligibility result persists on application record | PASS (code) | Result saved via `prisma.grantApplication.update({ data: { eligibilityResult: JSON.parse(JSON.stringify(output)) } })`. Schema has `eligibilityResult Json?` field. |
| 9 | Eligibility result renders with visual indicators | PASS (code) | `EligibilityPanel` renders: colour-coded `ScoreGauge` (emerald/amber/orange/red), `CriterionIcon` with CheckCircle2/AlertCircle/XCircle, status badges (Qualified/Partial/Not Qualified), gaps list, recommendations list. |
| 10 | Admin dashboard shows summary stats | PASS | Verified in browser. Shows: Total Grants (20, 14 open), Companies (1), Applications (0, 0 active), Needs Action (0). All fetched via `Promise.all` with Prisma queries. |
| 11 | Admin dashboard shows upcoming deadlines | PASS | "Upcoming Deadlines" section rendered. Shows "No active applications with deadlines." (correct since 0 applications exist). Query fetches non-closed apps with grant deadlines. |
| 12 | Stats link to filtered views | PASS | Verified in browser. "Total Grants" links to `/admin/grants`. "Companies" links to `/admin/companies`. "Applications" links to `/admin/pipeline`. "Needs Action" links to `/admin/pipeline?status=SUBMITTED`. Each status badge links to `/admin/pipeline?status=<STATUS>`. |
| 13 | User can change password from /dashboard/settings | PASS | Verified in browser. Changed password from `Admin123!` to `NewPass123!` and back. Form clears on success. Toast notification fires. |
| 14 | Password validation (min 8 chars, confirmation match) | PASS | Verified in browser. Empty submit shows "Current password is required" and "New password must be at least 8 characters". Mismatched passwords show "Passwords do not match". |
| 15 | Success/error feedback on password change | PASS | Toast notifications via `sonner`. Field-level error display for incorrect current password. Form fields clear on success. |
| 16 | All new server actions have Zod validation and auth checks | PASS | `documents.ts`: uses `documentUploadSchema`, `deleteDocumentSchema`, `getCurrentUser()`, `requireAdmin()`. `eligibility.ts`: uses `idSchema`, `requireAdmin()`. `password.ts`: uses `changePasswordSchema` with `.refine()`, `getCurrentUser()`. |
| 17 | Code compiles without TypeScript errors | PASS | `npx tsc --noEmit` completed with zero errors. |

---

## Critical Bug

### `eligibilitySchema` export from "use server" file causes 500 errors on all server actions

**File:** `src/lib/actions/eligibility.ts`
**Line:** 16

```typescript
export const eligibilitySchema = z.object({ ... });
```

This exports a Zod object (not an async function) from a `"use server"` file. Next.js App Router requires that `"use server"` files only export async functions. This causes a runtime error:

> `A "use server" file can only export async functions, found object.`

**Impact:** When any server action in the application is invoked, Next.js validates all `"use server"` modules in the build graph. This single invalid export causes a **500 Internal Server Error** on every server action call, including:
- Assigning grants to companies (verified -- 500 error on POST to `/admin/pipeline`)
- Updating application status
- Updating application notes
- Uploading documents
- Running eligibility assessments
- Potentially other actions

**The password change action is NOT affected** because `password.ts` is a separate `"use server"` file that apparently falls outside the affected module graph for the pipeline routes.

**Fix:** Move `eligibilitySchema` and `EligibilityResult` type to a shared types/validation file (e.g., `src/lib/validation.ts` or `src/lib/types/eligibility.ts`) and import from there.

---

## Code Quality Analysis

### Strengths
- **Consistent architecture:** All server actions follow the same pattern: auth check, Zod validation, business logic, `revalidatePath`, error handling.
- **Proper auth boundaries:** `requireAdmin()` for admin-only actions, `getCurrentUser()` for general auth. User access scoped to their own company's applications.
- **Secure file handling:** Signed upload URLs prevent direct storage access. File path sanitisation (`replace(/[^a-zA-Z0-9._-]/g, "_")`). Both client-side and server-side type/size validation.
- **AI prompt quality:** Well-structured prompt with company profile + grant criteria. Uses structured output via Vercel AI SDK `Output.object` with Zod schema validation. Graceful handling of missing API key with actionable error message.
- **Dashboard design:** Efficient parallel data fetching with `Promise.all`. Relative date formatting. Status-coloured indicators. All stat cards are clickable links.
- **TypeScript:** Clean compilation. Proper type definitions throughout. Correct serialisation of Date objects for client components.
- **Australian English:** Uses "colour", "organisation", "sanitised" consistently.

### Issues
1. **CRITICAL:** `eligibilitySchema` exported from `"use server"` file (see above).
2. **AlertDialogAction not closing dialog:** `AlertDialogAction` in the UI component is a plain `Button` not wrapping `AlertDialogPrimitive.Close`. The delete confirmation dialog may not auto-close after clicking "Delete". This is a minor UX concern depending on whether the component handles this via state.
3. **No error boundary:** Pipeline page has no error boundary around server action calls. A failed action shows a toast but the dialog buttons remain disabled permanently if the action errors before updating state.
4. **Missing server-side file type validation in upload:** The `getSignedUploadUrl` action does not validate the file type/size server-side. Only `saveDocumentMetadata` validates after upload. A user could upload a disallowed file type directly to Supabase Storage via the signed URL, and only the metadata save would fail (leaving an orphaned file in storage).
5. **`createClient()` in `getSignedDownloadUrl` is async but not awaited properly in the pattern** -- actually it is correct, using `await createClient()`.

### Minor Notes
- The `document-manager.tsx` does not refresh the page/list after successful upload. It calls `revalidatePath` server-side but the client component won't re-render with new data since it uses local state. The user would need to close and re-open the documents dialog.
- Password change form uses individual `useState` hooks for each field rather than a form library. Functional but verbose.
- No loading state indicator on the settings page title when password change is processing (only button spinner).

---

## Grading

| Criterion | Weight | Score (1-10) | Evidence |
|-----------|--------|-------------|----------|
| Functionality | 30% | 4 | Critical blocker: `eligibilitySchema` export bug causes 500 on all pipeline server actions. Document upload, grant assignment, status changes, AI eligibility, and notes all fail. Password change works. Dashboard renders correctly with stats and links. The code is architecturally sound but cannot be used in practice for core Sprint 3 features. |
| Code Quality | 20% | 7 | Consistent patterns, proper auth checks, Zod validation on all actions, clean TypeScript (zero errors). Secure signed URL pattern for file uploads. Well-structured AI prompt. Deducted for the `"use server"` export violation and missing server-side file type validation on upload URL generation. |
| Design Quality | 25% | 8 | Dashboard is clean and professional with summary stats, status breakdown, upcoming deadlines, and recent activity. Pipeline table includes Documents and AI columns with dialog-based workflows. Password change form is well-structured with clear labels and validation feedback. Score gauge with colour-coded tiers is thoughtful. All consistent with existing dark-mode design language. |
| Originality | 10% | 7 | Structured AI eligibility output with per-criterion assessment and visual rendering is well-thought-out. Score gauge with tiered colour labels (Strong/Moderate/Weak/Poor Fit) adds value. Dashboard "Needs Action" card combining submitted + under review is a practical design choice. Document checklist linking is a useful feature. |
| Test Coverage | 15% | 1 | No test framework installed. No unit tests, integration tests, or E2E tests for any Sprint 3 features. Zero test files in the project. |

### Weighted Score Calculation

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Functionality | 30% | 4 | 1.20 |
| Code Quality | 20% | 7 | 1.40 |
| Design Quality | 25% | 8 | 2.00 |
| Originality | 10% | 7 | 0.70 |
| Test Coverage | 15% | 1 | 0.15 |
| **Total** | **100%** | | **5.45** |

---

## Verdict: FAIL

**Weighted score: 5.45/10** (threshold: 7.0)
**Functionality score: 4/10** (threshold: 6.0, floor: 7.0)

### Reasons for Failure

1. **Functionality below floor (4 < 7):** The `eligibilitySchema` export bug is a showstopper that prevents all server actions on the pipeline page from executing. This means document upload, grant assignment, status changes, AI eligibility, and notes are all non-functional. Only the password change feature (on a separate route) works correctly.

2. **Weighted score below threshold (5.45 < 7.0):** Even with strong design and code quality, the functionality and test coverage scores drag the weighted average below passing.

3. **Zero test coverage (1/10):** No testing framework or tests exist. For a sprint introducing file uploads, AI integration, and auth flows, this is a significant gap.

### Required Fixes for Re-evaluation

1. **[CRITICAL] Move `eligibilitySchema` and `EligibilityResult` out of the `"use server"` file.** Create `src/lib/types/eligibility.ts` or add to `src/lib/validation.ts`. Import from there in both `eligibility.ts` (server action) and `eligibility-panel.tsx` (client component).

2. **[HIGH] Add at minimum:** Vitest/Jest setup, Zod schema unit tests for document/eligibility/password schemas, and basic smoke tests for server action auth checks.

3. **[MEDIUM] Verify document upload end-to-end** after fixing the export bug. Ensure `revalidatePath` actually refreshes the document list in the dialog.

4. **[LOW] Add server-side file type validation** in `getSignedUploadUrl` to prevent orphaned files of disallowed types in storage.
