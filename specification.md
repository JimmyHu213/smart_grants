# Specification: Smart Grants Platform

## Overview

Smart Grants is a SaaS grants management platform where administrators manage multiple client companies' grant applications across Australian Federal, State, and Territory programs. Admins maintain a master grant registry, assess eligibility using AI, drive applications through a status pipeline, and manage documents. Client users (companies) log in to view their application progress, upload required documents, and track deadlines. The platform launches with 20 real Australian grants from the Arafura Voyages reference document covering Federal, WA, NT, and QLD programs for First Nations tourism businesses.

## User Stories

### Admin Stories

- As an admin, I want to create and manage user accounts (client companies) so that each client has a secure login to track their grants.
- As an admin, I want to CRUD grant programs (name, jurisdiction, body, amount, deadline, status, external link, relevance rating) so that the registry stays current.
- As an admin, I want to define a document checklist per grant so that users know exactly what documents are required to apply.
- As an admin, I want to define process steps per grant so that users can follow the step-by-step application workflow.
- As an admin, I want to assign grants to a user's pipeline and change application status (not started > researching > drafting > submitted > under review > approved > rejected > closed) so that progress is tracked.
- As an admin, I want to lodge documents on behalf of a user (linked to specific grants and checklist items) so that applications can progress.
- As an admin, I want to run AI eligibility matching between a user's company profile and a grant's criteria so that I can quickly assess fit and surface gaps.
- As an admin, I want a dashboard showing all users' grant pipelines, upcoming deadlines, and urgent actions so that nothing falls through the cracks.
- As an admin, I want to close grants (mark as closed/no longer available) so that the registry reflects reality.

### User Stories

- As a user, I want to log in securely and see only my company's grant applications so that my data is private.
- As a user, I want to view my grant application pipeline with current status, next steps, and deadlines so that I understand where things stand.
- As a user, I want to upload documents against specific grant checklist items so that I can contribute to my applications.
- As a user, I want to see which documents are still required vs already uploaded for each grant so that I know what's outstanding.
- As a user, I want to change my password so that I can maintain account security.

## Technical Architecture

### Component Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                    (Vercel Hosting)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth Layer   │  │  Admin Pages │  │  User Pages   │  │
│  │  (Middleware)  │  │  /admin/*    │  │  /dashboard/* │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                  │                   │          │
│  ┌──────┴──────────────────┴───────────────────┴───────┐ │
│  │              Server Actions + API Routes             │ │
│  │         (Data mutations, file uploads, AI calls)     │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────┴──────┐ ┌─────┴──────┐ ┌──────┴──────┐
   │  Supabase   │ │  Supabase  │ │  Vercel AI  │
   │  Postgres   │ │  Storage   │ │  SDK +      │
   │  (via       │ │  (Docs)    │ │  Claude API │
   │   Prisma)   │ │            │ │             │
   └─────────────┘ └────────────┘ └─────────────┘
   │  Supabase   │
   │  Auth       │
   └─────────────┘
```

### Data Flow

1. **Authentication**: Supabase Auth handles email/password login. `@supabase/ssr` provides server-side session management via cookies. Next.js middleware refreshes sessions and enforces route protection. A `role` field in the user profile (stored in a `profiles` table synced with Supabase Auth) determines admin vs user access.

2. **Database Access**: Prisma Client connects to Supabase Postgres via connection pooling (Supavisor, port 6543, `?pgbouncer=true`). Prisma CLI uses the direct connection (port 5432) for migrations. All data queries go through Prisma in Server Components and Server Actions.

3. **File Storage**: Documents upload to Supabase Storage via signed upload URLs. Server Actions generate the signed URL, the client uploads directly to Supabase Storage, then the Server Action records the file metadata in the database. Files are organised by `{company_id}/{grant_application_id}/{filename}`.

4. **AI Eligibility**: The Vercel AI SDK's `generateObject` function calls Claude with a Zod schema to produce structured eligibility assessments. Input is the company profile + grant criteria. Output is a structured object with qualification status per criterion, overall fit score, gaps, and recommendations.

### Key Technology Choices

- **Prisma over Supabase JS client for data**: Type-safe queries, migration management, and schema-as-code. Supabase JS client is used only for Auth and Storage where its SDK is purpose-built.
- **Server Actions over API routes**: Collocated data mutations with form handling, progressive enhancement, built-in revalidation.
- **`generateObject` over free-form AI chat**: Structured output with Zod validation guarantees the eligibility response shape, making it reliably renderable in the UI.
- **App-level role checks over Supabase RLS**: Simpler to reason about with Prisma as the data layer. Middleware + server-side role checks enforce access control.

### Integration Points

- **Supabase Auth <> Next.js Middleware**: `@supabase/ssr` `createServerClient` in middleware refreshes sessions via `getClaims()`, redirects unauthenticated users.
- **Supabase Auth <> Profiles table**: An `auth.users` trigger (or app-level sync) creates a `profiles` row on signup with default role `user`.
- **Prisma <> Supabase Postgres**: Two connection strings — `DATABASE_URL` (pooled, port 6543) for runtime, `DIRECT_URL` (direct, port 5432) for CLI/migrations.
- **Vercel AI SDK <> Claude**: Via `@ai-sdk/anthropic` provider or Vercel AI Gateway OIDC. Fallback to direct API key.

## Database Schema

Key models in Prisma schema format. Field details are intentionally high-level — the Generator should flesh out exact field types, constraints, and indexes.

```prisma
model Profile {
  id        String   @id @default(uuid())
  authId    String   @unique  // References Supabase auth.users.id
  email     String   @unique
  role      Role     @default(USER)
  company   Company? @relation(fields: [companyId], references: [id])
  companyId String?
  // timestamps, name, phone, etc.
}

enum Role {
  ADMIN
  USER
}

model Company {
  id          String   @id @default(uuid())
  name        String
  abn         String?  @unique  // Australian Business Number
  // Company profile fields for AI eligibility matching:
  // jurisdiction, industry, indigenousOwnership, turnover,
  // tradingDuration, employeeCount, etc.
  profiles    Profile[]
  applications GrantApplication[]
}

model Grant {
  id               String   @id @default(uuid())
  name             String
  jurisdiction     Jurisdiction
  administeringBody String
  amount           String   // e.g. "Up to $5,000,000" — free text for flexible display
  status           GrantStatus @default(OPEN)
  deadline         String?  // Free text — some grants are "Ongoing", some have dates
  externalLink     String?
  relevanceRating  Int?     // 1-5 stars
  description      String   @db.Text
  eligibilityCriteria String? @db.Text  // Structured text for AI matching
  // timestamps
  checklistItems   GrantChecklistItem[]
  processSteps     GrantProcessStep[]
  applications     GrantApplication[]
}

enum Jurisdiction {
  FEDERAL
  WA
  NT
  QLD
  NSW
  VIC
  SA
  TAS
  ACT
}

enum GrantStatus {
  OPEN
  CLOSED
  MONITORING
}

model GrantChecklistItem {
  id       String @id @default(uuid())
  grant    Grant  @relation(fields: [grantId], references: [id])
  grantId  String
  label    String  // e.g. "Business Plan", "Certificate of Aboriginality"
  sortOrder Int
}

model GrantProcessStep {
  id       String @id @default(uuid())
  grant    Grant  @relation(fields: [grantId], references: [id])
  grantId  String
  label    String  // e.g. "Register with IBA", "Submit business plan"
  sortOrder Int
}

model GrantApplication {
  id        String            @id @default(uuid())
  company   Company           @relation(fields: [companyId], references: [id])
  companyId String
  grant     Grant             @relation(fields: [grantId], references: [id])
  grantId   String
  status    ApplicationStatus @default(NOT_STARTED)
  notes     String?           @db.Text
  // timestamps
  documents Document[]
  eligibilityResult Json?    // Stored AI eligibility assessment
}

enum ApplicationStatus {
  NOT_STARTED
  RESEARCHING
  DRAFTING
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  CLOSED
}

model Document {
  id              String           @id @default(uuid())
  application     GrantApplication @relation(fields: [applicationId], references: [id])
  applicationId   String
  checklistItem   GrantChecklistItem? @relation(fields: [checklistItemId], references: [id])
  checklistItemId String?
  fileName        String
  fileUrl         String           // Supabase Storage path
  fileSize        Int?
  mimeType        String?
  uploadedBy      Profile          @relation(fields: [uploadedById], references: [id])
  uploadedById    String
  // timestamps
}
```

## Feature List

| # | Feature | Priority | Acceptance Criteria | Sprint |
|---|---------|----------|-------------------|--------|
| 1 | Project Scaffold + Database | P0 | Next.js app runs locally with `npm run dev`. Prisma connects to Supabase Postgres. Schema migrated. 20 seed grants loaded. | 1 |
| 2 | Authentication | P0 | Admin and user can log in with email/password. Middleware redirects unauthenticated users to /login. Admin sees /admin routes. User sees /dashboard routes. Incorrect credentials show error. | 1 |
| 3 | Grant Registry (Admin) | P0 | Admin can view a list of all grants with filtering by jurisdiction and status. Admin can create, edit, and delete grants including checklist items and process steps. Changes persist across page reloads. | 1 |
| 4 | User/Company Management (Admin) | P0 | Admin can create a new user account (email + temp password) linked to a company. Admin can view all companies and their users. Company profile fields exist for AI matching. | 2 |
| 5 | Application Pipeline (Admin) | P0 | Admin can assign a grant to a company's pipeline. Admin can change application status through the defined workflow stages. A pipeline view shows all applications grouped by status. | 2 |
| 6 | User Dashboard | P0 | Logged-in user sees only their company's grant applications. Each application shows current status, next steps, deadline, and document checklist progress (X of Y uploaded). | 2 |
| 7 | Document Management | P0 | Admin and user can upload files (PDF, DOCX, images) against a grant application. Files link to specific checklist items. Uploaded documents appear in the application detail view with download links. Files stored in Supabase Storage. | 3 |
| 8 | AI Eligibility Matching | P1 | Admin can trigger an AI eligibility assessment for a company+grant pair. The system sends company profile + grant criteria to Claude via Vercel AI SDK. A structured result displays: per-criterion pass/fail, overall fit score (0-100), identified gaps, and recommendations. Result persists on the application record. | 3 |
| 9 | Admin Dashboard | P1 | Admin landing page shows: total grants, total active applications, applications by status breakdown, upcoming deadlines (next 30 days), and urgent actions. Clickable to drill into detail. | 3 |
| 10 | Password Change + User Settings | P1 | User can change their password from their settings page. Confirmation message shown. Old password required. | 3 |
| 11 | Grant Detail Public View | P2 | Each grant has a detail page showing full info: description, eligibility, amount, deadline, checklist, process steps, external link. Accessible to both admin and user roles. | 4 |
| 12 | Application Detail View | P1 | Detailed view of a single application showing: grant info, current status with timeline, document checklist with upload status, eligibility result (if run), notes. Admin can edit. User can view and upload. | 4 |
| 13 | Search and Filtering | P2 | Grants list supports text search across name and description. Application pipeline supports filtering by status, jurisdiction, and company. | 4 |
| 14 | Polish, Responsiveness, and Accessibility | P1 | All pages render correctly on mobile (375px) and desktop. Colour contrast meets WCAG AA. Keyboard navigation works for all primary actions. Loading and empty states handled. | 4 |

## Sprint Plan

### Sprint 1: Foundation — Scaffold, Auth, Grant Registry

**Features**: #1 (Project Scaffold + Database), #2 (Authentication), #3 (Grant Registry)

**Skills to use**:
- `vercel:nextjs` — App Router setup, Server Components, layouts, route groups
- `vercel:shadcn` — Component library init, data table, forms, dialogs
- `vercel:auth` — Supabase Auth integration pattern
- `vercel:env-vars` — Environment variable setup for Supabase + Prisma
- `frontend-design:frontend-design` — Establish visual design language from the start
- `ui-ux-pro-max` — Design system decisions (colour palette, typography, spacing)
- `superpowers:test-driven-development` — Schema validation tests, auth flow tests

**Done when**:
- `npm run dev` starts the app without errors
- Prisma schema is migrated and 20 grants from the reference document are seeded
- Navigating to any route while logged out redirects to /login
- Admin can log in, see the grants list, create a new grant, edit an existing grant, and delete a grant
- Grant CRUD persists to the database
- Admin routes return 403 for user-role accounts
- A non-admin user can log in and is redirected to /dashboard (even if dashboard is a placeholder)

### Sprint 2: Pipeline — Companies, Applications, User Dashboard

**Features**: #4 (User/Company Management), #5 (Application Pipeline), #6 (User Dashboard)

**Skills to use**:
- `vercel:nextjs` — Server Actions for data mutations, dynamic routes
- `vercel:shadcn` — Cards, badges, select menus, pipeline/kanban-style layout
- `frontend-design:frontend-design` — Pipeline visualisation, dashboard layout
- `superpowers:test-driven-development` — Application state transition tests
- `superpowers:subagent-driven-development` — Admin company CRUD and user dashboard can be built in parallel

**Done when**:
- Admin can create a new company with profile fields and a linked user account
- Admin can assign grants to a company's pipeline
- Admin can move an application through all status stages (not started through closed)
- Status transitions are validated (no skipping backwards arbitrarily)
- A user logging in sees only their company's applications
- Each application card shows status, grant name, deadline, and checklist progress
- A user cannot see other companies' data

### Sprint 3: Documents, AI Eligibility, Admin Dashboard

**Features**: #7 (Document Management), #8 (AI Eligibility Matching), #9 (Admin Dashboard), #10 (Password Change)

**Skills to use**:
- `vercel:vercel-storage` — File upload patterns (adapted for Supabase Storage signed URLs)
- `vercel:ai-sdk` — `generateObject` with Zod schema for eligibility assessment
- `vercel:ai-gateway` — Model routing configuration for Claude calls
- `vercel:shadcn` — File upload component, progress indicators, dashboard charts/stats
- `frontend-design:frontend-design` — Eligibility result visualisation, dashboard data density
- `superpowers:test-driven-development` — Upload flow tests, AI response schema tests
- `superpowers:subagent-driven-development` — Document upload, AI eligibility, and dashboard are independent

**Done when**:
- Admin and user can upload files (PDF, DOCX, PNG, JPG) up to 10MB against a grant application
- Uploaded files appear in the application detail with download links
- Files can be linked to specific checklist items
- Admin can trigger AI eligibility assessment for any company+grant pair
- AI returns structured result with per-criterion assessment, fit score, gaps, and recommendations
- Result renders in the UI and persists on the application record
- Admin dashboard shows summary stats and upcoming deadlines
- User can change their password from settings

### Sprint 4: Detail Views, Search, Polish

**Features**: #11 (Grant Detail View), #12 (Application Detail View), #13 (Search and Filtering), #14 (Polish and Accessibility)

**Skills to use**:
- `vercel:nextjs` — Dynamic routes, search params, streaming/suspense for search
- `vercel:shadcn` — Command palette or search input, responsive data tables
- `frontend-design:frontend-design` — Detail page layouts, responsive design
- `ui-ux-pro-max` — Final UI polish pass
- `vercel:deployments-cicd` — Deploy to Vercel
- `superpowers:test-driven-development` — Search result accuracy tests, responsive layout tests
- `superpowers:subagent-driven-development` — Detail views and search are independent

**Done when**:
- Grant detail page shows all grant information including checklist and process steps
- Application detail page shows full context with status timeline, documents, and eligibility
- Admin can edit application notes and status from the detail view
- User can upload documents from the application detail view
- Text search works across grants (name + description)
- Pipeline filtering works by status, jurisdiction, and company
- All pages render correctly at 375px mobile width
- No accessibility violations at WCAG AA level for primary flows
- App deploys successfully to Vercel

## Evaluator Configuration

### Grading Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Functionality | 30% | Do all acceptance criteria pass? Can admin and user complete their primary workflows end-to-end? |
| Code Quality | 20% | Clean TypeScript, proper error handling, consistent patterns, no `any` types, Server/Client component boundaries correct, Prisma queries efficient. |
| Design Quality | 25% | Coherent visual design — not a collection of unstyled components. Consistent spacing, colour, typography. Dashboard and pipeline feel purpose-built, not generic. |
| Originality | 10% | Custom design decisions vs AI-default patterns. Avoids purple gradients on white cards. Grants management feels like a real product, not a tutorial. |
| Test Coverage | 15% | Critical paths have tests: auth flow, grant CRUD, status transitions, AI response schema validation, file upload. |

### Pass Threshold

- **Minimum per criterion**: 6/10 — any criterion scoring below 6 fails the sprint and returns to Generator with specific feedback.
- **Minimum weighted total**: 7/10 — even if all individual criteria pass, the weighted average must reach 7.
- **Functionality hard floor**: 7/10 — functionality cannot pass at 6; if core workflows are broken, the sprint fails regardless of other scores.

### Evaluator Testing Protocol

1. **Start the dev server** and verify it runs without errors.
2. **Test auth flow**: Log in as admin, log in as user, attempt unauthorised access, test invalid credentials.
3. **Test each acceptance criterion** from the sprint's feature list — interact with the UI as a real user would.
4. **Inspect the database** (via Prisma Studio or direct query) to verify data persistence.
5. **Test file uploads** by actually uploading files and downloading them.
6. **Test AI eligibility** by triggering an assessment and verifying the structured response renders.
7. **Run mobile viewport test** at 375px width for all primary pages.
8. **Run accessibility audit** using Lighthouse or axe-core on primary pages.
9. **Review code** for TypeScript quality, component boundaries, and security (no leaked secrets, proper auth checks on all Server Actions).

## Skills Assignment

### Generator Skills

| Skill | When to Use |
|---|---|
| `vercel:nextjs` | App Router pages, Server Components, Server Actions, layouts, route groups, middleware, dynamic routes |
| `vercel:shadcn` | UI component installation and composition — data tables, forms, dialogs, cards, badges, command palette |
| `vercel:auth` | Supabase Auth integration — login page, middleware session refresh, role-based route protection |
| `vercel:ai-sdk` | AI eligibility matching — `generateObject` with Zod schema, Claude provider setup, structured output |
| `vercel:ai-gateway` | Model routing configuration for Claude API calls, OIDC setup if available, API key fallback |
| `vercel:vercel-storage` | File upload patterns — adapted for Supabase Storage signed URLs instead of Vercel Blob |
| `vercel:deployments-cicd` | Deploy to Vercel in Sprint 4 |
| `vercel:env-vars` | Environment variable setup — Supabase URL, keys, Prisma connection strings, AI API keys |
| `frontend-design:frontend-design` | Production-quality UI — avoid generic AI aesthetics, build distinctive interface |
| `ui-ux-pro-max` | Design system decisions — colour palette, typography scale, spacing system, component patterns |
| `superpowers:test-driven-development` | Write tests alongside features — schema validation, auth flows, status transitions, AI response shape |
| `superpowers:subagent-driven-development` | Parallelise independent tasks within sprints (e.g. admin CRUD + user dashboard in Sprint 2) |

### Evaluator Skills

| Skill | When to Use |
|---|---|
| `superpowers:systematic-debugging` | When a test fails or behaviour is unexpected — investigate root cause before suggesting fixes |
| `superpowers:requesting-code-review` | Code review each sprint against spec — TypeScript quality, security, conventions, architecture |
| `superpowers:verification-before-completion` | Before marking any sprint as passed — run verification commands, confirm output with evidence |
| `vercel:verification` | End-to-end flow verification — browser > Server Action > database > response for each feature |
| `vercel:react-best-practices` | TSX quality review — component boundaries, hooks usage, accessibility, performance patterns |
| `chrome-devtools-mcp:chrome-devtools` | Browser-based testing — navigate pages, test forms, verify uploads, check network requests |
| `chrome-devtools-mcp:a11y-debugging` | Accessibility audit — semantic HTML, ARIA labels, focus states, keyboard navigation, contrast ratios |

## Assumptions

1. **Single admin account initially**: The system supports the admin role, but for MVP there is one admin account created during seed. Multi-admin is supported by the schema but not a priority workflow.

2. **Email/password auth only**: No social logins, magic links, or SSO for MVP. Supabase Auth email/password is sufficient.

3. **Admin creates user accounts**: Users do not self-register. Admin creates accounts and provides credentials. This reflects the B2B service model where Smart Grants onboards clients.

4. **Company profile is manually entered**: Company data for AI eligibility matching is entered by the admin (or user) into structured fields — not scraped or imported from external sources.

5. **AI eligibility is on-demand**: The admin explicitly triggers an eligibility check per company+grant pair. There is no background batch processing or automatic re-evaluation.

6. **File size limit 10MB**: Reasonable for business documents (PDFs, images, Word docs). Larger files are out of scope.

7. **No real-time features**: No live notifications, real-time status updates, or WebSocket connections. Users refresh to see updates.

8. **Grant data is free-text friendly**: Amounts and deadlines are stored as strings where needed (e.g. "Up to $5,000,000", "Ongoing — no fixed deadline") because real grant data is not always numeric or date-parseable.

9. **Australian context**: All currency in AUD, dates DD/MM/YYYY, Australian English spelling throughout (organisation, colour, programme for government context).

10. **Supabase free tier**: The platform runs on Supabase free tier (500MB DB, 1GB storage, 50K auth users) which is sufficient for early-stage SaaS.

11. **20 seed grants from reference document**: The Arafura Voyages grants report provides the initial data. Grants are seeded with: name, jurisdiction, administering body, amount, status, deadline, external link, relevance rating, and description. Checklist items and process steps are populated where the reference document provides sufficient detail.

12. **Prisma latest stable version**: Using the current Prisma release with `prisma.config.ts` for dual connection URL setup (pooled for runtime, direct for CLI).

## Out of Scope

1. **Self-service user registration** — Admin-only account creation for MVP.
2. **Email notifications** — No transactional emails for status changes, deadlines, or account creation.
3. **Multi-tenancy isolation at database level** — App-level filtering by company, not schema-per-tenant.
4. **Grant auto-discovery** — No scraping or API integration with GrantConnect, business.gov.au, or other registries.
5. **Payment/billing** — No subscription management, invoicing, or payment processing.
6. **Document versioning** — Upload replaces; no version history for MVP.
7. **Audit trail** — No detailed activity log of who changed what and when.
8. **Bulk operations** — No bulk status changes, bulk grant import/export, or batch AI assessments.
9. **Internationalisation** — Australian English only. No multi-language support.
10. **Offline support** — Requires internet connection.
11. **Native mobile app** — Responsive web only.
12. **Advanced AI features** — No AI-generated application drafts, no document analysis/OCR, no chatbot. Only structured eligibility matching.
13. **Supabase RLS policies** — Access control is app-level via middleware and Server Action checks, not database-level RLS.
14. **CI/CD pipeline** — Vercel auto-deploy from git is sufficient. No custom GitHub Actions or test pipelines for MVP.

## Seed Data Plan (Sprint 1)

The 20 grants from the Arafura Voyages reference document, organised by section:

### Federal (5 grants)
1. IBA Business Loan Package (incl. 30% Non-Repayable Grant) — up to $5,000,000
2. IBA Start-Up Finance Package — up to $100,000
3. NIAA First Nations Tourism Grants + Free Mentoring Program — up to $50,000
4. Export Market Development Grant (EMDG) — up to $770,000
5. Supply Nation Registration + Indigenous Procurement Policy (IPP) — Government contract revenue

### Western Australia (2 grants)
6. Tourism WA — Aboriginal Tourism Development Program — varies by round
7. ILSC — Our Country Our Future (WA Sea Country) — land and sea asset support

### Northern Territory (6 grants)
8. Aboriginal Tourism Grant Program — Round 9 (NT) — significant per application
9. Aboriginal Tourism Development Support Grant — Round 4 (NT) — professional services funding
10. Aboriginal Tourism Product Distribution Grant Program (NT) — distribution funding
11. Unlocking Aboriginal Tourism Development Funding (NT) — consultancy services
12. NT Aboriginal Tourism Accelerator Program 2026 — structured program support
13. Northern Land Council — Arnhem Land Entry Permits and Cultural Tourism Partnerships — permit value

### Queensland (7 grants)
14. Strategic Indigenous Tourism Projects (SITP) — TEQ — $6,000,000 total fund
15. Growing Indigenous Tourism in Queensland Fund — $7,000,000 total fund
16. First Nations Innovation Acceleration Program QLD — up to $100,000
17. Queensland Destination Events Program (QDEP) — TEQ — up to 25% of event budget
18. Cultural Tourism Fund — Arts Queensland — up to $160,000 over 2 years
19. Queensland Indigenous Business Network (QIBN) + Black Business Finder (BBF) — procurement access
20. Brisbane 2032 Olympic and Paralympic Games — First Nations Tourism Strategic Opportunity — multiple rounds TBA

Each grant is seeded with fields extracted from the reference document: name, jurisdiction, administering body, amount (as display string), status (OPEN/MONITORING/CLOSED), deadline (as display string), external link, relevance rating (1-5), and full description text. Checklist items and process steps are created where the reference document specifies actionable steps.
