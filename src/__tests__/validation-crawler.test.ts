import { describe, it, expect } from "vitest";
import {
  crawledGrantSchema,
  crawlerResponseSchema,
  reviewActionSchema,
  bulkReviewActionSchema,
} from "@/lib/validation";

describe("crawledGrantSchema", () => {
  function validGrant() {
    return {
      name: "Test Grant",
      jurisdiction: "FEDERAL" as const,
      administeringBody: "Test Body",
      amount: "Up to $50,000",
      status: "OPEN" as const,
      deadline: "30 June 2026",
      externalLink: "https://example.gov.au",
      sourceUrl: "https://example.gov.au/grant/123",
      description: "A test grant for testing.",
      eligibilityCriteria: "Must be eligible.",
      checklistItems: [{ label: "Business Plan", sortOrder: 1 }],
      processSteps: [{ label: "Apply online", sortOrder: 1 }],
    };
  }

  it("accepts valid crawled grant", () => {
    const result = crawledGrantSchema.safeParse(validGrant());
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const data = { ...validGrant(), name: "" };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("requires sourceUrl", () => {
    const data = { ...validGrant(), sourceUrl: "" };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts empty checklist and process steps", () => {
    const data = { ...validGrant(), checklistItems: [], processSteps: [] };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid jurisdiction", () => {
    const data = { ...validGrant(), jurisdiction: "MARS" };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("requires description", () => {
    const data = { ...validGrant(), description: "" };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("defaults optional fields", () => {
    const data = {
      name: "Grant",
      jurisdiction: "QLD" as const,
      administeringBody: "Dept",
      amount: "$10,000",
      status: "OPEN" as const,
      sourceUrl: "https://example.com",
      description: "Desc",
    };
    const result = crawledGrantSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deadline).toBe("");
      expect(result.data.checklistItems).toEqual([]);
      expect(result.data.processSteps).toEqual([]);
    }
  });
});

describe("crawlerResponseSchema", () => {
  it("accepts valid response with grants and errors", () => {
    const result = crawlerResponseSchema.safeParse({
      grants: [
        {
          name: "Grant A",
          jurisdiction: "QLD",
          administeringBody: "Dept A",
          amount: "$10,000",
          status: "OPEN",
          sourceUrl: "https://example.com/a",
          description: "Desc A",
          checklistItems: [],
          processSteps: [],
        },
      ],
      errors: ["wa_gov: timeout"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty grants array", () => {
    const result = crawlerResponseSchema.safeParse({
      grants: [],
      errors: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing grants field", () => {
    const result = crawlerResponseSchema.safeParse({
      errors: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewActionSchema", () => {
  it("accepts approve action", () => {
    const result = reviewActionSchema.safeParse({
      grantId: "abc-123",
      action: "approve",
    });
    expect(result.success).toBe(true);
  });

  it("accepts reject action", () => {
    const result = reviewActionSchema.safeParse({
      grantId: "abc-123",
      action: "reject",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = reviewActionSchema.safeParse({
      grantId: "abc-123",
      action: "delete",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty grantId", () => {
    const result = reviewActionSchema.safeParse({
      grantId: "",
      action: "approve",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkReviewActionSchema", () => {
  it("accepts bulk approve", () => {
    const result = bulkReviewActionSchema.safeParse({
      grantIds: ["id-1", "id-2"],
      action: "approve",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty grantIds", () => {
    const result = bulkReviewActionSchema.safeParse({
      grantIds: [],
      action: "approve",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = bulkReviewActionSchema.safeParse({
      grantIds: ["id-1"],
      action: "maybe",
    });
    expect(result.success).toBe(false);
  });
});
