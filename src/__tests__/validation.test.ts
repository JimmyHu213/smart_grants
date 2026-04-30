import { describe, it, expect } from "vitest";
import {
  grantFormSchema,
  companyFormSchema,
  createUserSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  updateApplicationNotesSchema,
  idSchema,
  eligibilitySchema,
  documentUploadSchema,
  checklistItemSchema,
  processStepSchema,
} from "@/lib/validation";

// ─── Helper: valid base grant data ──────────────────────

function validGrant() {
  return {
    name: "NT Indigenous Business Fund",
    jurisdiction: "NT" as const,
    administeringBody: "NT Government",
    amount: "$50,000",
    status: "OPEN" as const,
    deadline: "30/06/2026",
    externalLink: "https://example.com/grant",
    relevanceRating: 4,
    description: "Supporting indigenous businesses in the Northern Territory.",
    eligibilityCriteria: "Must be indigenous-owned",
    checklistItems: [{ label: "ABN certificate", sortOrder: 0 }],
    processSteps: [{ label: "Submit EOI", sortOrder: 0 }],
  };
}

// ─── Grant Schema ───────────────────────────────────────

describe("grantFormSchema", () => {
  it("accepts valid grant data", () => {
    const result = grantFormSchema.safeParse(validGrant());
    expect(result.success).toBe(true);
  });

  it("accepts grant data with defaults applied", () => {
    const minimal = {
      name: "Test Grant",
      jurisdiction: "FEDERAL",
      administeringBody: "ATO",
      amount: "$10,000",
      status: "OPEN",
      description: "A test grant programme.",
    };
    const result = grantFormSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deadline).toBe("");
      expect(result.data.externalLink).toBe("");
      expect(result.data.relevanceRating).toBe(3);
      expect(result.data.checklistItems).toEqual([]);
      expect(result.data.processSteps).toEqual([]);
    }
  });

  it("rejects when name is missing", () => {
    const data = { ...validGrant(), name: "" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when jurisdiction is invalid", () => {
    const data = { ...validGrant(), jurisdiction: "MARS" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when administering body is missing", () => {
    const data = { ...validGrant(), administeringBody: "" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when amount is missing", () => {
    const data = { ...validGrant(), amount: "" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when status is invalid", () => {
    const data = { ...validGrant(), status: "PENDING" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when description is missing", () => {
    const data = { ...validGrant(), description: "" };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when relevance rating is out of range (too low)", () => {
    const data = { ...validGrant(), relevanceRating: 0 };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when relevance rating is out of range (too high)", () => {
    const data = { ...validGrant(), relevanceRating: 6 };
    const result = grantFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all valid jurisdictions", () => {
    const jurisdictions = ["FEDERAL", "WA", "NT", "QLD", "NSW", "VIC", "SA", "TAS", "ACT"];
    for (const j of jurisdictions) {
      const data = { ...validGrant(), jurisdiction: j };
      const result = grantFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid grant statuses", () => {
    for (const s of ["OPEN", "CLOSED", "MONITORING"]) {
      const data = { ...validGrant(), status: s };
      const result = grantFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });
});

// ─── Checklist Item Schema ──────────────────────────────

describe("checklistItemSchema", () => {
  it("accepts valid checklist item", () => {
    const result = checklistItemSchema.safeParse({ label: "ABN", sortOrder: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts checklist item with optional id", () => {
    const result = checklistItemSchema.safeParse({ id: "abc", label: "ABN", sortOrder: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects empty label", () => {
    const result = checklistItemSchema.safeParse({ label: "", sortOrder: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative sort order", () => {
    const result = checklistItemSchema.safeParse({ label: "ABN", sortOrder: -1 });
    expect(result.success).toBe(false);
  });
});

// ─── Process Step Schema ────────────────────────────────

describe("processStepSchema", () => {
  it("accepts valid process step", () => {
    const result = processStepSchema.safeParse({ label: "Submit form", sortOrder: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects empty label", () => {
    const result = processStepSchema.safeParse({ label: "", sortOrder: 0 });
    expect(result.success).toBe(false);
  });
});

// ─── Company Schema ─────────────────────────────────────

describe("companyFormSchema", () => {
  it("accepts valid company data", () => {
    const result = companyFormSchema.safeParse({
      name: "Arafura Voyages Pty Ltd",
      abn: "12345678901",
      jurisdiction: "NT",
      industry: "Tourism",
      indigenousOwnership: true,
      turnover: "$1M - $5M",
      tradingDuration: "5 years",
      employeeCount: 25,
      description: "Tourism operator in the Northern Territory.",
    });
    expect(result.success).toBe(true);
  });

  it("requires company name", () => {
    const result = companyFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts company with only required name field", () => {
    const result = companyFormSchema.safeParse({ name: "Test Company" });
    expect(result.success).toBe(true);
  });

  it("accepts ABN with spaces (11 digits)", () => {
    const result = companyFormSchema.safeParse({
      name: "Test Co",
      abn: "12 345 678 901",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty ABN string", () => {
    const result = companyFormSchema.safeParse({
      name: "Test Co",
      abn: "",
    });
    expect(result.success).toBe(true);
  });

  it("defaults indigenousOwnership to false", () => {
    const result = companyFormSchema.safeParse({ name: "Test Co" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.indigenousOwnership).toBe(false);
    }
  });

  it("accepts null employee count", () => {
    const result = companyFormSchema.safeParse({
      name: "Test Co",
      employeeCount: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative employee count", () => {
    const result = companyFormSchema.safeParse({
      name: "Test Co",
      employeeCount: -5,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Create User Schema ─────────────────────────────────

describe("createUserSchema", () => {
  it("accepts valid user data", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      fullName: "Jane Smith",
      companyId: "comp-123",
    });
    expect(result.success).toBe(true);
  });

  it("requires valid email format", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      password: "securepassword",
      companyId: "comp-123",
    });
    expect(result.success).toBe(false);
  });

  it("requires password of at least 6 characters", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "12345",
      companyId: "comp-123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password of exactly 6 characters", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "123456",
      companyId: "comp-123",
    });
    expect(result.success).toBe(true);
  });

  it("requires companyId", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      companyId: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty fullName", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      fullName: "",
      companyId: "comp-123",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Application Schemas ────────────────────────────────

describe("createApplicationSchema", () => {
  it("accepts valid application data", () => {
    const result = createApplicationSchema.safeParse({
      companyId: "comp-123",
      grantId: "grant-456",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional notes", () => {
    const result = createApplicationSchema.safeParse({
      companyId: "comp-123",
      grantId: "grant-456",
      notes: "Initial research phase",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty companyId", () => {
    const result = createApplicationSchema.safeParse({
      companyId: "",
      grantId: "grant-456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty grantId", () => {
    const result = createApplicationSchema.safeParse({
      companyId: "comp-123",
      grantId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateApplicationStatusSchema", () => {
  it("accepts valid status update", () => {
    const result = updateApplicationStatusSchema.safeParse({
      applicationId: "app-789",
      status: "DRAFTING",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = updateApplicationStatusSchema.safeParse({
      applicationId: "app-789",
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty applicationId", () => {
    const result = updateApplicationStatusSchema.safeParse({
      applicationId: "",
      status: "DRAFTING",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid application statuses", () => {
    const statuses = [
      "NOT_STARTED", "RESEARCHING", "DRAFTING", "SUBMITTED",
      "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED",
    ];
    for (const status of statuses) {
      const result = updateApplicationStatusSchema.safeParse({
        applicationId: "app-789",
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateApplicationNotesSchema", () => {
  it("accepts valid notes update", () => {
    const result = updateApplicationNotesSchema.safeParse({
      applicationId: "app-789",
      notes: "Updated notes for this application.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty notes", () => {
    const result = updateApplicationNotesSchema.safeParse({
      applicationId: "app-789",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 10,000 characters", () => {
    const result = updateApplicationNotesSchema.safeParse({
      applicationId: "app-789",
      notes: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts notes at exactly 10,000 characters", () => {
    const result = updateApplicationNotesSchema.safeParse({
      applicationId: "app-789",
      notes: "x".repeat(10000),
    });
    expect(result.success).toBe(true);
  });
});

// ─── ID Schema ──────────────────────────────────────────

describe("idSchema", () => {
  it("accepts a short ID like g01", () => {
    const result = idSchema.safeParse("g01");
    expect(result.success).toBe(true);
  });

  it("accepts a UUID", () => {
    const result = idSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("accepts any non-empty string", () => {
    const result = idSchema.safeParse("abc-123-def");
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    const result = idSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

// ─── Eligibility Schema ─────────────────────────────────

describe("eligibilitySchema", () => {
  function validEligibility() {
    return {
      overallScore: 75,
      criteria: [
        {
          name: "Indigenous ownership",
          status: "qualified" as const,
          explanation: "Company is 100% indigenous-owned.",
        },
        {
          name: "NT-based operations",
          status: "partial" as const,
          explanation: "Headquarters in Darwin, some operations interstate.",
        },
      ],
      gaps: ["Annual turnover documentation missing"],
      recommendations: ["Upload latest financial statements"],
      summary: "Strong candidate with minor documentation gaps.",
    };
  }

  it("accepts valid eligibility result", () => {
    const result = eligibilitySchema.safeParse(validEligibility());
    expect(result.success).toBe(true);
  });

  it("accepts score of 0 (minimum bound)", () => {
    const data = { ...validEligibility(), overallScore: 0 };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts score of 100 (maximum bound)", () => {
    const data = { ...validEligibility(), overallScore: 100 };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects score below 0", () => {
    const data = { ...validEligibility(), overallScore: -1 };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects score above 100", () => {
    const data = { ...validEligibility(), overallScore: 101 };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts all valid criterion status values", () => {
    for (const status of ["qualified", "partial", "not_qualified"] as const) {
      const data = validEligibility();
      (data.criteria[0] as Record<string, unknown>).status = status;
      const result = eligibilitySchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid criterion status", () => {
    const data = validEligibility();
    (data.criteria[0] as Record<string, unknown>).status = "unknown";
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts empty arrays for gaps and recommendations", () => {
    const data = { ...validEligibility(), gaps: [], recommendations: [] };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts empty criteria array", () => {
    const data = { ...validEligibility(), criteria: [] };
    const result = eligibilitySchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── Document Upload Schema ─────────────────────────────

describe("documentUploadSchema", () => {
  function validDocument() {
    return {
      applicationId: "app-123",
      fileName: "business-plan.pdf",
      fileUrl: "https://storage.example.com/files/business-plan.pdf",
      fileSize: 1024 * 1024, // 1 MB
      mimeType: "application/pdf",
    };
  }

  it("accepts valid PDF upload", () => {
    const result = documentUploadSchema.safeParse(validDocument());
    expect(result.success).toBe(true);
  });

  it("accepts valid DOCX upload", () => {
    const data = {
      ...validDocument(),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts valid PNG upload", () => {
    const data = { ...validDocument(), mimeType: "image/png" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts valid JPG upload", () => {
    const data = { ...validDocument(), mimeType: "image/jpeg" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects disallowed mime type (text/plain)", () => {
    const data = { ...validDocument(), mimeType: "text/plain" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects disallowed mime type (application/zip)", () => {
    const data = { ...validDocument(), mimeType: "application/zip" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects file exceeding 10 MB", () => {
    const data = { ...validDocument(), fileSize: 10 * 1024 * 1024 + 1 };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts file at exactly 10 MB", () => {
    const data = { ...validDocument(), fileSize: 10 * 1024 * 1024 };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects file size of 0", () => {
    const data = { ...validDocument(), fileSize: 0 };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty applicationId", () => {
    const data = { ...validDocument(), applicationId: "" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty fileName", () => {
    const data = { ...validDocument(), fileName: "" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty fileUrl", () => {
    const data = { ...validDocument(), fileUrl: "" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts optional checklistItemId", () => {
    const data = { ...validDocument(), checklistItemId: "item-1" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts empty checklistItemId", () => {
    const data = { ...validDocument(), checklistItemId: "" };
    const result = documentUploadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
