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
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { reviewGrant, bulkReviewGrants } from "@/lib/actions/review";
import { prisma } from "@/lib/db";

describe("reviewGrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a grant", async () => {
    const result = await reviewGrant("grant-1", "approve");
    expect(result.success).toBe(true);
    expect(prisma.grant.update).toHaveBeenCalledWith({
      where: { id: "grant-1" },
      data: { reviewStatus: "APPROVED" },
    });
  });

  it("rejects a grant", async () => {
    const result = await reviewGrant("grant-1", "reject");
    expect(result.success).toBe(true);
    expect(prisma.grant.update).toHaveBeenCalledWith({
      where: { id: "grant-1" },
      data: { reviewStatus: "REJECTED" },
    });
  });

  it("rejects invalid action", async () => {
    const result = await reviewGrant("grant-1", "delete" as "approve");
    expect(result.success).toBe(false);
  });

  it("rejects empty grantId", async () => {
    const result = await reviewGrant("", "approve");
    expect(result.success).toBe(false);
  });
});

describe("bulkReviewGrants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bulk approves grants", async () => {
    vi.mocked(prisma.grant.updateMany).mockResolvedValue({ count: 3 } as never);

    const result = await bulkReviewGrants(["g1", "g2", "g3"], "approve");
    expect(result.success).toBe(true);
    expect(prisma.grant.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["g1", "g2", "g3"] } },
      data: { reviewStatus: "APPROVED" },
    });
  });

  it("bulk rejects grants", async () => {
    vi.mocked(prisma.grant.updateMany).mockResolvedValue({ count: 2 } as never);

    const result = await bulkReviewGrants(["g1", "g2"], "reject");
    expect(result.success).toBe(true);
    expect(prisma.grant.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["g1", "g2"] } },
      data: { reviewStatus: "REJECTED" },
    });
  });

  it("rejects empty grantIds", async () => {
    const result = await bulkReviewGrants([], "approve");
    expect(result.success).toBe(false);
  });
});
