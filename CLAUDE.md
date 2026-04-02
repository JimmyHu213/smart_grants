# Smart Grants System

## Project Overview

A SaaS grants management platform where admins manage multiple client companies' grant applications. Each client company (user) logs in to view their progress, upload documents, and track eligibility. Admins manage the grant registry, assess eligibility, and drive applications forward.

**Initial seed data**: 20 Australian grants from the Arafura Voyages reference document (`reference/Arafura_Voyages_Grants_By_State.docx`), covering Federal, WA, NT, and QLD programs. The system is not limited to this data — admins can CRUD any grants.

## System Requirements

### Roles

**Admin** (primary user of the system):

- Create and manage user accounts
- CRUD grants (create, read, update, delete grant programs)
- Update grant information (deadlines, amounts, documents required, process steps)
- Lodge documents on behalf of users
- Change grant application status (e.g. researching > drafting > submitted > approved/rejected > closed)
- Close grants
- View and manage all users' grant progress

**User** (grant applicants):

- Log in to their account
- update account information
- View their grant application progress
- Lodge/upload documents
- Change password

### Core Features

1. **Grant Registry** — Master list of all available grants
   - Each grant has: name, jurisdiction, administering body, amount, deadline, status (open/closed/monitoring), external link to original platform, relevance rating
   - Document checklist per grant (what documents are required to apply)
   - Process steps per grant (step-by-step application workflow)
   - Admin can CRUD all grant data

2. **AI Eligibility Matching** — Evaluate whether a user/organisation qualifies for a grant
   - Match user profile data against grant eligibility criteria
   - Surface what's qualified, what's missing, what needs attention
   - AI-powered analysis of fit between applicant and grant requirements

3. **Application Pipeline** — Track each user's grant applications through stages
   - Status workflow per application (e.g. not started > researching > drafting > submitted > under review > approved/rejected > closed)
   - Document checklist tracking (which required docs have been uploaded)
   - Timeline/deadline visibility

4. **Document Management** — Upload, store, and track documents per grant application
   - Users and admins can lodge documents
   - Documents linked to specific grants and checklist items

5. **Authentication** — Login system with role-based access (admin vs user)
   - Secure login
   - Password change for users
   - Admin account creation for new users

## Tech Stack

- **Frontend + API**: Next.js (App Router) on Vercel
- **Database**: Supabase (Postgres + Auth + Storage)
- **ORM**: Prisma (connected to Supabase Postgres)
- **Auth**: Supabase Auth (email/password, role-based via RLS or app-level)
- **File Storage**: Supabase Storage (documents, uploads)
- **AI Eligibility**: Claude API via Vercel AI Gateway (OIDC) — fallback to direct API key if needed
- **UI**: shadcn/ui + Tailwind CSS
- **Deployment**: Vercel (frontend/API) + Supabase (DB + Auth + Storage)

### Cost Strategy

- Vercel free/hobby tier for frontend
- Supabase free tier (500MB DB, 1GB storage, 50K monthly auth users)
- AI: Vercel AI Gateway OIDC (uses existing Claude subscription if possible, otherwise API key with budget controls)

## Conventions

- Australian English spelling (organisation, colour, programme where appropriate for government context)
- All dollar amounts in AUD unless stated otherwise
- Grant program names must match official names exactly
- Dates in DD/MM/YYYY format (Australian standard)
- Confidential & privileged — no public exposure of business strategy details

## DO NOT

- change files outside of the current folder
- remove any files without warnings
