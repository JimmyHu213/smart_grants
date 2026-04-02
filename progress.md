# Sprint 1 Progress: Foundation — Scaffold, Auth, Grant Registry

## Status: Complete

## What Was Built

### Feature 1: Project Scaffold + Database
- **Next.js 16.2.2** App Router with TypeScript and Turbopack
- **Prisma 7** ORM with full schema: Profile, Company, Grant, GrantChecklistItem, GrantProcessStep, GrantApplication, Document
- All enums: Role, Jurisdiction, GrantStatus, ApplicationStatus
- Dual connection string setup: pooled (DATABASE_URL) for runtime, direct (DIRECT_URL) for migrations
- **shadcn/ui** (v4, base-nova style) with Tailwind CSS v4 — 17 components installed
- Seed script with 20 Australian grants from the Arafura Voyages reference document
- `.env.example` template with all required variables
- Custom dark-mode-first colour scheme with teal/cyan accent

### Feature 2: Authentication
- **Supabase Auth** integration using `@supabase/ssr` for server-side session management
- Login page (`/login`) with email/password, error handling, and loading states
- Next.js 16 `proxy.ts` (replacing middleware.ts) that refreshes sessions and redirects unauthenticated users
- Role-based route protection via App Router layouts:
  - `/admin/*` — requires ADMIN role, returns 403 for USER accounts
  - `/dashboard/*` — accessible to authenticated users
  - Root `/` — redirects to `/admin/grants` for admins, `/dashboard` for users
- Server-side `getCurrentUser()` and `requireAdmin()` helper functions
- Sign-out route handler at `/auth/signout`

### Feature 3: Grant Registry (Admin)
- Admin grants page (`/admin/grants`) with data table displaying all grants
- **Filtering** by jurisdiction (9 Australian states/territories + Federal) and status (Open/Closed/Monitoring)
- **Create grant** dialog with tabbed form: Details, Checklist Items, Process Steps
- **Edit grant** dialog (same form, pre-populated)
- **Delete grant** with AlertDialog confirmation
- All CRUD via Server Actions with `revalidatePath` for data freshness
- Each grant row shows: name, jurisdiction badge, administering body, amount, status badge, star rating, deadline, and actions dropdown

## Seed Data
- 5 Federal grants (IBA, NIAA, Austrade, Supply Nation)
- 2 WA grants (Tourism WA, ILSC)
- 6 NT grants (DTH rounds, NLC permits, Tourism Accelerator)
- 7 QLD grants (SITP, GITQ, FAC, QDEP, Arts QLD, QIBN/BBF, Brisbane 2032)

Each grant includes: name, jurisdiction, administering body, amount, status, deadline, external link, relevance rating (1-5), description, eligibility criteria, checklist items (2-5 per grant), and process steps (4-5 per grant).

## Architecture Decisions
- **Prisma 7** with `@prisma/adapter-pg` driver adapter for Supabase Postgres connection pooling
- **Base UI** (via shadcn v4 base-nova) — uses `render` prop pattern instead of Radix `asChild`
- **Server Actions** for all data mutations, not API routes
- **App-level role checks** in layouts and Server Actions, not Supabase RLS
- **Route groups**: `(auth)` for login, `(admin)` for admin pages, `(dashboard)` for user pages
- **Dark mode by default** with `class="dark"` on the HTML element

## Setup Instructions

1. Copy `.env.example` to `.env.local` and fill in Supabase credentials
2. Run `npx prisma generate` to generate the Prisma client
3. Run `npx prisma migrate dev --name init` to create the database tables
4. Run `npx prisma db seed` to seed the 20 grants
5. Create an admin user in Supabase Auth dashboard
6. Insert a matching profile row: `INSERT INTO profiles (id, auth_id, email, role) VALUES (uuid, supabase_user_id, email, 'ADMIN')`
7. Run `npm run dev` to start the development server

## Known Limitations
- No automated test suite yet (Sprint 1 contract item pending)
- Profile creation not automated on Supabase Auth signup (manual insert required)
- No password change functionality yet (Sprint 3)

---

# Sprint 2 Progress: Pipeline — Companies, Applications, User Dashboard

## Status: Complete

## What Was Built

### Feature 4: User/Company Management (Admin)
- Admin page at `/admin/companies` showing all companies in a data table
- **Create company** dialog with all profile fields for AI eligibility matching:
  name, ABN, jurisdiction, industry, indigenous ownership (boolean), turnover, trading duration, employee count, description
- **Edit company** dialog (same form, pre-populated)
- **Create user account** dialog linked to a company: email + temporary password
  - Uses Supabase Auth admin API (service role key) when available
  - Falls back to regular signUp if service role key not configured
  - Creates both Auth user and Profile record in database
- Summary cards showing total companies, total users, and active applications
- Dropdown actions per company row: Edit Company, Add User

### Feature 5: Application Pipeline (Admin)
- Admin page at `/admin/pipeline` showing all grant applications
- **Assign grant** dialog to add a grant to a company's pipeline (creates GrantApplication)
  - Prevents duplicate assignments (unique constraint on [companyId, grantId])
  - Validates company and grant exist before creating
- **Status transitions** validated with forward-only movement:
  - NOT_STARTED → RESEARCHING → DRAFTING → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → CLOSED
  - Can always move to CLOSED from any state
  - Cannot go backwards (e.g. SUBMITTED → DRAFTING is blocked)
  - Status dropdown only shows valid next statuses
- **Status summary cards** — clickable cards showing count per status, acts as a filter
- **Filtering** by status and company via URL search params
- **Application notes** — edit via dialog with Save/Cancel
- Each application row shows: grant name, jurisdiction, company, status badge, deadline, document checklist progress (X/Y), notes button, status change dropdown

### Feature 6: User Dashboard
- `/dashboard` page showing only the logged-in user's company applications
- Each application card shows:
  - Grant name, jurisdiction badge, status badge
  - Amount
  - Next process step (derived from grant's process steps based on status)
  - Deadline
  - Document checklist progress (X/Y with visual progress bar)
- Summary cards: Total Applications, Active Applications, Approved
- Dashboard shell with navigation: Dashboard, Settings (placeholder)
- Account dropdown with sign out
- Graceful handling when user has no linked company

### Sprint 1 Fixes Applied
- **Zod validation** added to ALL server actions (grants, companies, users, applications)
- **Environment variable validation** — created `src/lib/env.ts` with Zod schema, replaced all `!` non-null assertions
- **Accessibility** — added `sr-only` labels to action buttons, table header cells, and progress bars
- **Admin navigation** expanded: Grants, Companies, Pipeline

## New Dependencies
- `zod` — Input validation for server actions and environment variables

## Key Files Added/Modified
- `src/lib/env.ts` — Environment variable validation
- `src/lib/validation.ts` — Zod schemas and status transition logic
- `src/lib/actions/companies.ts` — Company CRUD and user account creation
- `src/lib/actions/applications.ts` — Application CRUD and status management
- `src/app/(admin)/admin/companies/` — Companies admin page (4 files)
- `src/app/(admin)/admin/pipeline/` — Pipeline admin page (3 files)
- `src/app/(dashboard)/dashboard/page.tsx` — User dashboard (rebuilt)
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Settings placeholder
- `src/components/dashboard-shell.tsx` — User navigation shell

## Architecture Notes
- Same patterns as Sprint 1: Server Components for data fetching, Client Components for interactivity
- Server Actions with Zod validation and `requireAdmin()` guard
- Status transition validation is centralised in `validation.ts`
- User dashboard is scoped by `companyId` from the session — no RLS needed
- Supabase admin client created separately for user management (service role key)
