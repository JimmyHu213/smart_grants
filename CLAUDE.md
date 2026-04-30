# Smart Grants System

## Project Overview

A SaaS grants management platform where admins manage multiple client companies' grant applications. Each client company (user) logs in to view their progress, upload documents, and track eligibility. Admins manage the grant registry, assess eligibility, and drive applications forward.

**Initial seed data**: 20 Australian grants from the Arafura Voyages reference document (`reference/Arafura_Voyages_Grants_By_State.docx`), covering Federal, WA, NT, and QLD programs. The system is not limited to this data — admins can CRUD any grants.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | Supabase Postgres |
| ORM | Prisma 7 (PrismaPg adapter) |
| Auth | Supabase Auth (email/password, role-based) |
| File Storage | Supabase Storage |
| AI | Claude API via Vercel AI SDK v6 |
| UI | shadcn/ui v4 + Tailwind CSS v4 |
| Testing | Vitest + Testing Library |
| Validation | Zod |
| Deployment | Vercel (frontend/API) + Supabase (DB/Auth/Storage) |
| CI/CD | GitHub Actions |

### Cost Strategy

- Vercel free/hobby tier for frontend
- Supabase free tier (500MB DB, 1GB storage, 50K monthly auth users)
- AI: Vercel AI Gateway OIDC (uses existing Claude subscription if possible, otherwise API key with budget controls)

---

## Roles & Features

### Roles

**Admin** (primary user of the system):
- Create and manage user accounts
- CRUD grants (create, read, update, delete grant programs)
- Update grant information (deadlines, amounts, documents required, process steps)
- Lodge documents on behalf of users
- Change grant application status (researching > drafting > submitted > approved/rejected > closed)
- View and manage all users' grant progress

**User** (grant applicants):
- Log in to their account
- Update account information
- View their grant application progress
- Lodge/upload documents
- Change password

### Core Features

1. **Grant Registry** — Master list of all available grants with checklist items and process steps
2. **AI Eligibility Matching** — Claude-powered analysis of company fit against grant criteria
3. **Application Pipeline** — Track applications through status workflow stages
4. **Document Management** — Upload, store, and track documents per grant application
5. **Authentication** — Login with role-based access (admin vs user)

---

## Development Workflow

### Branch Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Vercel production |
| `feature/*` | New features | Vercel preview |
| `fix/*` | Bug fixes | Vercel preview |
| `chore/*` | Maintenance, deps, CI | Vercel preview |

**Rules:**
- Never push directly to `main` — always open a PR
- All PRs must pass CI (lint, typecheck, test, build) before merge
- Squash-merge PRs into `main` to keep history clean
- Delete feature branches after merge

### Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `test:` — Adding or updating tests
- `docs:` — Documentation only
- `chore:` — Build, CI, deps, tooling
- `refactor:` — Code change that neither fixes a bug nor adds a feature

**Examples:**
```
feat: add grant deadline notifications
fix: prevent duplicate application submissions
test: add eligibility assessment edge cases
chore: upgrade Prisma to v7.7
```

### Pull Request Process

1. Create branch from `main` (`feature/`, `fix/`, `chore/`)
2. Make changes with passing tests
3. Push branch, open PR against `main`
4. CI must pass (lint + typecheck + test + build)
5. Squash-merge once approved
6. Delete the branch

### CI/CD Pipeline

GitHub Actions runs on every push to `main` and every PR:

| Job | What it does | Blocks build? |
|---|---|---|
| **Lint** | `npm run lint` (ESLint) | Yes |
| **Type Check** | `tsc --noEmit` | Yes |
| **Tests** | `vitest run` (175+ unit tests) | Yes |
| **Build** | `next build` (runs after all 3 pass) | — |

Vercel auto-deploys:
- **Preview** on every PR push
- **Production** on merge to `main`

---

## Coding Standards

### TypeScript

- Strict mode enabled — no `any` unless absolutely unavoidable
- Use `@/` path alias for all imports (e.g. `@/lib/db`, `@/components/ui/button`)
- Prefer `interface` for object shapes, `type` for unions/intersections
- No `!` non-null assertions — use proper null checks or Zod validation

### Server Actions

- Every server action file starts with `"use server"`
- All inputs validated with Zod schemas from `@/lib/validation`
- All mutating actions check auth via `requireAdmin()` or `getCurrentUser()`
- Return `{ success: boolean; error?: string }` — never throw to the client
- Call `revalidatePath()` after mutations

### Components

- Use shadcn/ui components from `@/components/ui/`
- Client components only when needed (`"use client"` for interactivity)
- Server Components by default
- Responsive design: mobile-first, test at 640px breakpoint

### Database

- All schema changes go through Prisma migrations (`npm run db:migrate`)
- Never modify the database directly in production
- Use `@@map()` for table names (snake_case in Postgres, PascalCase in Prisma)
- Add `@@index` for frequently filtered/joined columns

### Validation

- Central schemas in `src/lib/validation.ts`
- Validate at system boundaries (server actions, API routes)
- Use `safeParse` — never `parse` (don't throw on invalid input)

### Testing

- Unit tests in `src/__tests__/` mirroring source structure
- Test files named `*.test.ts` or `*.test.tsx`
- Mock external dependencies (Prisma, Supabase) — don't hit real services in tests
- Run `npm run test:run` before committing

---

## Project Structure

```
src/
  app/
    (admin)/admin/     # Admin pages (grants, companies, users, pipeline, dashboard)
    (dashboard)/       # User pages (dashboard, applications, settings)
    login/             # Auth pages
  components/
    ui/                # shadcn/ui primitives
    *.tsx              # Feature components (status-stepper, document-manager, etc.)
  lib/
    actions/           # Server Actions (grants, companies, applications, documents, etc.)
    supabase/          # Supabase client setup (server.ts)
    auth.ts            # Auth helpers (getCurrentUser, requireAdmin)
    db.ts              # Prisma client singleton
    env.ts             # Environment variable validation
    validation.ts      # All Zod schemas
  __tests__/           # Unit tests
  generated/prisma/    # Prisma generated client (gitignored)
prisma/
  schema.prisma        # Database schema
  seed.ts              # Seed data (20 grants, checklist items, process steps)
  migrations/          # Prisma migrations
```

---

## Conventions

- Australian English spelling (organisation, colour, programme where appropriate for government context)
- All dollar amounts in AUD unless stated otherwise
- Grant program names must match official names exactly
- Dates in DD/MM/YYYY format (Australian standard)
- Confidential & privileged — no public exposure of business strategy details

---

## Security Boundaries

- **Never commit secrets** — `.env.local` is gitignored, use `.env.example` for templates
- **No raw SQL** — always use Prisma ORM
- **Auth on every mutation** — `requireAdmin()` or `getCurrentUser()` before any data change
- **Validate all inputs** — Zod `safeParse` on every server action, no trusting client data
- **File uploads** — validate type (PDF/DOCX/PNG/JPG) and size (max 10MB) before accepting
- **Signed URLs only** — never expose raw Supabase Storage paths to clients
- **No unsafe HTML rendering** — if rendering user content, sanitise first
- **Service role key** — server-side only, never exposed to the client (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Environment Variables

| Variable | Required | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server |
| `DATABASE_URL` | Yes | Server (Prisma) |
| `DIRECT_URL` | Yes | Server (Prisma CLI) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server (admin ops) |
| `ANTHROPIC_API_KEY` | Optional | Server (AI eligibility) |

See `.env.example` for template.

---

## DO NOT

- Push directly to `main` — always use a PR
- Commit `.env.local` or any file containing secrets
- Change files outside of the project folder
- Remove any files without warning
- Skip CI checks or use `--no-verify`
- Use `any` type without justification
- Write server actions without auth guards
- Expose service role keys to client-side code
- Modify Supabase auth.users table directly — use the admin API
- Deploy database migrations without testing locally first
