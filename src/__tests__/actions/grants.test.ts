import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ──────────────────────────────────

// Mock next/cache (revalidatePath is called by server actions)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth — default to admin authenticated
const mockRequireAdmin = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

// Mock Prisma
const mockGrantCreate = vi.fn();
const mockGrantUpdate = vi.fn();
const mockGrantDelete = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    grant: {
      create: (...args: unknown[]) => mockGrantCreate(...args),
      update: (...args: unknown[]) => mockGrantUpdate(...args),
      delete: (...args: unknown[]) => mockGrantDelete(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// Now import the module under test
import { createGrant, updateGrant, deleteGrant } from "@/lib/actions/grants";
import type { GrantFormData } from "@/lib/actions/grants";

// ─── Test Data ──────────────────────────────────────────

function validGrantData(): GrantFormData {
  return {
    name: "NT Indigenous Business Fund",
    jurisdiction: "NT",
    administeringBody: "NT Government",
    amount: "$50,000",
    status: "OPEN",
    deadline: "30/06/2026",
    externalLink: "https://example.com",
    relevanceRating: 4,
    description: "Supporting indigenous businesses.",
    eligibilityCriteria: "Must be indigenous-owned",
    checklistItems: [{ label: "ABN certificate", sortOrder: 0 }],
    processSteps: [{ label: "Submit EOI", sortOrder: 0 }],
  };
}

// ─── createGrant ────────────────────────────────────────

describe("createGrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
    });
    mockGrantCreate.mockResolvedValue({ id: "new-grant-1" });
  });

  it("succeeds with valid data and admin authentication", async () => {
    const result = await createGrant(validGrantData());
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("calls requireAdmin before processing", async () => {
    await createGrant(validGrantData());
    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("calls prisma.grant.create with validated data", async () => {
    await createGrant(validGrantData());
    expect(mockGrantCreate).toHaveBeenCalledOnce();

    const callArgs = mockGrantCreate.mock.calls[0][0];
    expect(callArgs.data.name).toBe("NT Indigenous Business Fund");
    expect(callArgs.data.jurisdiction).toBe("NT");
    expect(callArgs.data.checklistItems.create).toHaveLength(1);
    expect(callArgs.data.processSteps.create).toHaveLength(1);
  });

  it("returns error when Zod validation fails (missing name)", async () => {
    const data = { ...validGrantData(), name: "" };
    const result = await createGrant(data);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when Zod validation fails (invalid jurisdiction)", async () => {
    const data = { ...validGrantData(), jurisdiction: "MARS" as GrantFormData["jurisdiction"] };
    const result = await createGrant(data);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated as admin", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Not authenticated"));
    const result = await createGrant(validGrantData());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when prisma create throws", async () => {
    mockGrantCreate.mockRejectedValue(new Error("Database connection failed"));
    const result = await createGrant(validGrantData());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Database connection failed");
  });

  it("does not call prisma when validation fails", async () => {
    const data = { ...validGrantData(), name: "" };
    await createGrant(data);
    expect(mockGrantCreate).not.toHaveBeenCalled();
  });
});

// ─── updateGrant ────────────────────────────────────────

describe("updateGrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
    });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        grant: { update: vi.fn() },
        grantChecklistItem: { deleteMany: vi.fn(), createMany: vi.fn() },
        grantProcessStep: { deleteMany: vi.fn(), createMany: vi.fn() },
      };
      await fn(tx);
    });
  });

  it("succeeds with valid ID and data", async () => {
    const result = await updateGrant("grant-123", validGrantData());
    expect(result.success).toBe(true);
  });

  it("calls requireAdmin before processing", async () => {
    await updateGrant("grant-123", validGrantData());
    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("returns error when ID is empty", async () => {
    const result = await updateGrant("", validGrantData());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid grant ID");
  });

  it("returns error when Zod validation of data fails", async () => {
    const data = { ...validGrantData(), name: "" };
    const result = await updateGrant("grant-123", data);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Not authenticated"));
    const result = await updateGrant("grant-123", validGrantData());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when transaction fails", async () => {
    mockTransaction.mockRejectedValue(new Error("Transaction failed"));
    const result = await updateGrant("grant-123", validGrantData());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Transaction failed");
  });

  it("uses a transaction for update operations", async () => {
    await updateGrant("grant-123", validGrantData());
    expect(mockTransaction).toHaveBeenCalledOnce();
  });
});

// ─── deleteGrant ────────────────────────────────────────

describe("deleteGrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
    });
    mockGrantDelete.mockResolvedValue({ id: "grant-123" });
  });

  it("succeeds with valid ID", async () => {
    const result = await deleteGrant("grant-123");
    expect(result.success).toBe(true);
  });

  it("calls requireAdmin before processing", async () => {
    await deleteGrant("grant-123");
    expect(mockRequireAdmin).toHaveBeenCalledOnce();
  });

  it("calls prisma.grant.delete with the correct ID", async () => {
    await deleteGrant("grant-123");
    expect(mockGrantDelete).toHaveBeenCalledWith({ where: { id: "grant-123" } });
  });

  it("returns error when ID is empty", async () => {
    const result = await deleteGrant("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid grant ID");
  });

  it("returns error when not authenticated", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Not authenticated"));
    const result = await deleteGrant("grant-123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when prisma delete throws", async () => {
    mockGrantDelete.mockRejectedValue(new Error("Record not found"));
    const result = await deleteGrant("grant-123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Record not found");
  });

  it("does not call prisma when ID validation fails", async () => {
    await deleteGrant("");
    expect(mockGrantDelete).not.toHaveBeenCalled();
  });

  it("accepts short IDs like g01", async () => {
    const result = await deleteGrant("g01");
    expect(result.success).toBe(true);
    expect(mockGrantDelete).toHaveBeenCalledWith({ where: { id: "g01" } });
  });

  it("accepts UUID-format IDs", async () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const result = await deleteGrant(uuid);
    expect(result.success).toBe(true);
    expect(mockGrantDelete).toHaveBeenCalledWith({ where: { id: uuid } });
  });
});
