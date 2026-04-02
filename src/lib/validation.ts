import { z } from "zod";

// ─── Grant Schemas ────────────────────────────────────

const JURISDICTIONS = [
  "FEDERAL", "WA", "NT", "QLD", "NSW", "VIC", "SA", "TAS", "ACT",
] as const;

const GRANT_STATUSES = ["OPEN", "CLOSED", "MONITORING"] as const;

const APPLICATION_STATUSES = [
  "NOT_STARTED",
  "RESEARCHING",
  "DRAFTING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CLOSED",
] as const;

export const checklistItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Checklist item label is required"),
  sortOrder: z.number().int().min(0),
});

export const processStepSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Process step label is required"),
  sortOrder: z.number().int().min(0),
});

export const grantFormSchema = z.object({
  name: z.string().min(1, "Grant name is required").max(500),
  jurisdiction: z.enum(JURISDICTIONS, { message: "Invalid jurisdiction" }),
  administeringBody: z.string().min(1, "Administering body is required").max(500),
  amount: z.string().min(1, "Amount is required").max(200),
  status: z.enum(GRANT_STATUSES, { message: "Invalid status" }),
  deadline: z.string().max(200).default(""),
  externalLink: z.string().max(1000).default(""),
  relevanceRating: z.number().int().min(1).max(5).default(3),
  description: z.string().min(1, "Description is required"),
  eligibilityCriteria: z.string().default(""),
  checklistItems: z.array(checklistItemSchema).default([]),
  processSteps: z.array(processStepSchema).default([]),
});

// ─── Company Schemas ──────────────────────────────────

export const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required").max(300),
  abn: z
    .string()
    .max(20)
    .refine(
      (val) => !val || /^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/.test(val.replace(/\s/g, "") ? val : ""),
      { message: "ABN must be 11 digits" }
    )
    .optional()
    .or(z.literal("")),
  jurisdiction: z.string().max(100).optional().or(z.literal("")),
  industry: z.string().max(200).optional().or(z.literal("")),
  indigenousOwnership: z.boolean().default(false),
  turnover: z.string().max(200).optional().or(z.literal("")),
  tradingDuration: z.string().max(200).optional().or(z.literal("")),
  employeeCount: z.number().int().min(0).max(1000000).nullable().optional(),
  description: z.string().max(5000).optional().or(z.literal("")),
});

// ─── User/Profile Schemas ─────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().max(200).optional().or(z.literal("")),
  companyId: z.string().min(1, "Company ID is required"),
});

// ─── Application Schemas ──────────────────────────────

export const createApplicationSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  grantId: z.string().min(1, "Grant ID is required"),
  notes: z.string().max(10000).optional().or(z.literal("")),
});

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES, {
  message: "Invalid application status",
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  status: applicationStatusSchema,
});

export const updateApplicationNotesSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  notes: z.string().max(10000),
});

// ─── Status Transition Validation ─────────────────────

/**
 * Allowed status transitions. Each status maps to the set of statuses
 * it can transition TO.
 *
 * Rules:
 * - Forward movement through the pipeline is allowed
 * - Can always move to CLOSED from any status
 * - Cannot go backwards arbitrarily (e.g. SUBMITTED -> DRAFTING)
 * - APPROVED/REJECTED can only go to CLOSED
 */
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  NOT_STARTED: new Set(["RESEARCHING", "CLOSED"]),
  RESEARCHING: new Set(["DRAFTING", "CLOSED"]),
  DRAFTING: new Set(["SUBMITTED", "CLOSED"]),
  SUBMITTED: new Set(["UNDER_REVIEW", "CLOSED"]),
  UNDER_REVIEW: new Set(["APPROVED", "REJECTED", "CLOSED"]),
  APPROVED: new Set(["CLOSED"]),
  REJECTED: new Set(["CLOSED"]),
  CLOSED: new Set([]), // Terminal state
};

export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  if (currentStatus === newStatus) return true; // No change is always valid
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed ? allowed.has(newStatus) : false;
}

export function getAllowedNextStatuses(currentStatus: string): string[] {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed ? [currentStatus, ...Array.from(allowed)] : [currentStatus];
}

// ─── ID Schema ────────────────────────────────────────

export const idSchema = z.string().min(1, "ID is required");
