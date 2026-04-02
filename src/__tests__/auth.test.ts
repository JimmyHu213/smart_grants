import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies before importing the module ──────

// Mock Supabase server client
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// Mock Prisma client
const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// Now import the module under test
import { getCurrentUser, requireAdmin, requireRole } from "@/lib/auth";

// ─── Test Data ──────────────────────────────────────────

const mockAdminProfile = {
  id: "profile-1",
  authId: "auth-uuid-admin",
  email: "admin@smartgrants.com.au",
  role: "ADMIN" as const,
  fullName: "Admin User",
  companyId: null,
};

const mockUserProfile = {
  id: "profile-2",
  authId: "auth-uuid-user",
  email: "user@company.com.au",
  role: "USER" as const,
  fullName: "Regular User",
  companyId: "company-1",
};

// ─── getCurrentUser ─────────────────────────────────────

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user data when authenticated with a profile", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-admin" } },
    });
    mockFindUnique.mockResolvedValue(mockAdminProfile);

    const user = await getCurrentUser();

    expect(user).toEqual({
      id: "profile-1",
      authId: "auth-uuid-admin",
      email: "admin@smartgrants.com.au",
      role: "ADMIN",
      fullName: "Admin User",
      companyId: null,
    });
  });

  it("returns null when Supabase auth returns no user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const user = await getCurrentUser();
    expect(user).toBeNull();
    // Should not query prisma if no auth user
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when auth user exists but no profile in database", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-orphan" } },
    });
    mockFindUnique.mockResolvedValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("looks up profile by authId from Supabase user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-user" } },
    });
    mockFindUnique.mockResolvedValue(mockUserProfile);

    await getCurrentUser();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { authId: "auth-uuid-user" },
    });
  });

  it("returns user role from the profile", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-user" } },
    });
    mockFindUnique.mockResolvedValue(mockUserProfile);

    const user = await getCurrentUser();
    expect(user?.role).toBe("USER");
    expect(user?.companyId).toBe("company-1");
  });
});

// ─── requireAdmin ───────────────────────────────────────

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns admin user when authenticated as admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-admin" } },
    });
    mockFindUnique.mockResolvedValue(mockAdminProfile);

    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
    expect(user.email).toBe("admin@smartgrants.com.au");
  });

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(requireAdmin()).rejects.toThrow("Not authenticated");
  });

  it("throws when user has USER role (not admin)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-user" } },
    });
    mockFindUnique.mockResolvedValue(mockUserProfile);

    await expect(requireAdmin()).rejects.toThrow("Insufficient permissions");
  });

  it("throws when authenticated user has no profile", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-unknown" } },
    });
    mockFindUnique.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow("Not authenticated");
  });
});

// ─── requireRole ────────────────────────────────────────

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when role matches", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-user" } },
    });
    mockFindUnique.mockResolvedValue(mockUserProfile);

    const user = await requireRole("USER");
    expect(user.role).toBe("USER");
  });

  it("throws when role does not match", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-uuid-user" } },
    });
    mockFindUnique.mockResolvedValue(mockUserProfile);

    await expect(requireRole("ADMIN")).rejects.toThrow("Insufficient permissions");
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(requireRole("USER")).rejects.toThrow("Not authenticated");
  });
});
