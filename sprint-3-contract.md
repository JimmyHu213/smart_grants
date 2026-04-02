# Sprint 3 Contract: Documents, AI Eligibility, Admin Dashboard, Password Change

## Acceptance Criteria

- [ ] Admin and user can upload files (PDF, DOCX, PNG, JPG, up to 10MB) to a grant application
- [ ] Uploaded files stored in Supabase Storage
- [ ] Documents listed with filename, size, date, uploader, checklist item link, download link
- [ ] Documents can be linked to specific checklist items
- [ ] Admin can delete documents
- [ ] Admin can trigger AI eligibility assessment for a company+grant pair
- [ ] AI returns structured result: score, per-criterion assessment, gaps, recommendations
- [ ] Eligibility result persists on the application record
- [ ] Eligibility result renders with visual indicators in the UI
- [ ] Admin dashboard shows summary stats (grants, companies, applications by status)
- [ ] Admin dashboard shows upcoming deadlines
- [ ] Stats link to filtered views
- [ ] User can change password from /dashboard/settings
- [ ] Password validation (min 8 chars, confirmation match)
- [ ] Success/error feedback on password change
- [ ] All new server actions have Zod validation and auth checks
- [ ] Code compiles without TypeScript errors
