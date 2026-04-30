import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-1",
    authId: "auth-1",
    email: "admin@test.com",
    role: "ADMIN",
    fullName: "Admin",
    companyId: null,
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    grant: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    grantChecklistItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    grantProcessStep: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        grant: {
          create: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
        grantChecklistItem: {
          deleteMany: vi.fn().mockResolvedValue({}),
          createMany: vi.fn().mockResolvedValue({}),
        },
        grantProcessStep: {
          deleteMany: vi.fn().mockResolvedValue({}),
          createMany: vi.fn().mockResolvedValue({}),
        },
      })
    ),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { processCrawlerResults } from "@/lib/actions/crawl";
import { prisma } from "@/lib/db";
import type { CrawlerResponse } from "@/lib/validation";

function makeGrant(overrides: Partial<CrawlerResponse["grants"][0]> = {}): CrawlerResponse["grants"][0] {
  return {
    name: "Test Grant",
    jurisdiction: "FEDERAL",
    administeringBody: "Test Body",
    amount: "$50,000",
    status: "OPEN",
    deadline: "",
    externalLink: "",
    sourceUrl: "https://example.com/grant",
    description: "A test grant.",
    eligibilityCriteria: "",
    checklistItems: [],
    processSteps: [],
    ...overrides,
  };
}

describe("processCrawlerResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves new grants as PENDING_REVIEW", async () => {
    vi.mocked(prisma.grant.findFirst).mockResolvedValue(null);

    const result = await processCrawlerResults({
      grants: [makeGrant()],
      errors: [],
    });

    expect(result.new).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("skips rejected grants", async () => {
    vi.mocked(prisma.grant.findFirst).mockResolvedValue({
      id: "existing-1",
      reviewStatus: "REJECTED",
      source: "CRAWLED",
    } as never);

    const result = await processCrawlerResults({
      grants: [makeGrant({ sourceUrl: "https://example.com/rejected" })],
      errors: [],
    });

    expect(result.new).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("skips manually edited grants", async () => {
    vi.mocked(prisma.grant.findFirst).mockResolvedValue({
      id: "existing-2",
      reviewStatus: "APPROVED",
      source: "MANUAL",
    } as never);

    const result = await processCrawlerResults({
      grants: [makeGrant({ sourceUrl: "https://example.com/manual" })],
      errors: [],
    });

    expect(result.new).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("updates existing crawled grants", async () => {
    vi.mocked(prisma.grant.findFirst).mockResolvedValue({
      id: "existing-3",
      reviewStatus: "APPROVED",
      source: "CRAWLED",
    } as never);

    const result = await processCrawlerResults({
      grants: [makeGrant({ sourceUrl: "https://example.com/existing" })],
      errors: [],
    });

    expect(result.updated).toBe(1);
    expect(result.new).toBe(0);
  });

  it("includes crawler errors in summary", async () => {
    const result = await processCrawlerResults({
      grants: [],
      errors: ["wa_gov: timeout after 60s"],
    });

    expect(result.errors).toEqual(["wa_gov: timeout after 60s"]);
  });

  it("handles multiple grants with mixed results", async () => {
    vi.mocked(prisma.grant.findFirst)
      .mockResolvedValueOnce(null) // new
      .mockResolvedValueOnce({
        id: "rej-1",
        reviewStatus: "REJECTED",
        source: "CRAWLED",
      } as never); // skipped

    const result = await processCrawlerResults({
      grants: [
        makeGrant({ sourceUrl: "https://example.com/new" }),
        makeGrant({ sourceUrl: "https://example.com/rejected" }),
      ],
      errors: [],
    });

    expect(result.new).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
