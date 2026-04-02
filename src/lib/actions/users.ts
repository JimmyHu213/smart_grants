"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateUserSchema, resetPasswordSchema, idSchema } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/server";

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Types ───────────────────────────────────────────

export type UserWithCompany = {
  id: string;
  authId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
};

// ─── Get Users ───────────────────────────────────────

export async function getUsers(): Promise<UserWithCompany[]> {
  await requireAdmin();

  const profiles = await prisma.profile.findMany({
    include: {
      company: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    authId: profile.authId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    role: profile.role,
    companyId: profile.companyId,
    companyName: profile.company?.name ?? null,
    createdAt: profile.createdAt.toISOString(),
  }));
}

// ─── Update User ─────────────────────────────────────

export type UpdateUserData = {
  fullName?: string;
  phone?: string;
  role: "ADMIN" | "USER";
  companyId: string;
};

export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const idResult = idSchema.safeParse(id);
    if (!idResult.success) {
      return { success: false, error: "Invalid user ID" };
    }

    const parsed = updateUserSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    // Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: validated.companyId },
    });
    if (!company) {
      return { success: false, error: "Company not found" };
    }

    // Verify the profile exists
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    await prisma.profile.update({
      where: { id },
      data: {
        fullName: validated.fullName || null,
        phone: validated.phone || null,
        role: validated.role,
        companyId: validated.companyId,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message };
  }
}

// ─── Reset User Password ─────────────────────────────

export async function resetUserPassword(
  authId: string,
  data: { newPassword: string; confirmPassword: string }
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const idResult = idSchema.safeParse(authId);
    if (!idResult.success) {
      return { success: false, error: "Invalid auth ID" };
    }

    const parsed = resetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return {
        success: false,
        error: "Admin client unavailable. Service role key may not be configured.",
      };
    }

    const { error } = await adminClient.auth.admin.updateUserById(authId, {
      password: validated.newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    return { success: false, error: message };
  }
}

// ─── Delete User ─────────────────────────────────────

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const currentUser = await requireAdmin();

    const idResult = idSchema.safeParse(id);
    if (!idResult.success) {
      return { success: false, error: "Invalid user ID" };
    }

    // Find the profile
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      return { success: false, error: "User not found" };
    }

    // Prevent self-deletion
    if (profile.id === currentUser.id) {
      return { success: false, error: "You cannot delete your own account" };
    }

    // Delete Supabase auth user
    const adminClient = createAdminClient();
    if (!adminClient) {
      return {
        success: false,
        error: "Admin client unavailable. Service role key may not be configured.",
      };
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(
      profile.authId
    );

    if (authError) {
      return { success: false, error: authError.message };
    }

    // Delete the profile record
    await prisma.profile.delete({ where: { id } });

    revalidatePath("/admin/users");
    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, error: message };
  }
}
