"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { companyFormSchema, createUserSchema, idSchema } from "@/lib/validation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Create Company ───────────────────────────────────

export type CompanyFormData = {
  name: string;
  abn?: string;
  jurisdiction?: string;
  industry?: string;
  indigenousOwnership: boolean;
  turnover?: string;
  tradingDuration?: string;
  employeeCount?: number | null;
  description?: string;
};

export async function createCompany(
  data: CompanyFormData
): Promise<ActionResult & { companyId?: string }> {
  try {
    await requireAdmin();

    const parsed = companyFormSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    const company = await prisma.company.create({
      data: {
        name: validated.name,
        abn: validated.abn || null,
        jurisdiction: validated.jurisdiction || null,
        industry: validated.industry || null,
        indigenousOwnership: validated.indigenousOwnership,
        turnover: validated.turnover || null,
        tradingDuration: validated.tradingDuration || null,
        employeeCount: validated.employeeCount ?? null,
        description: validated.description || null,
      },
    });

    revalidatePath("/admin/companies");
    return { success: true, companyId: company.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create company";
    return { success: false, error: message };
  }
}

// ─── Update Company ───────────────────────────────────

export async function updateCompany(
  id: string,
  data: CompanyFormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const idResult = idSchema.safeParse(id);
    if (!idResult.success) {
      return { success: false, error: "Invalid company ID" };
    }

    const parsed = companyFormSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    await prisma.company.update({
      where: { id },
      data: {
        name: validated.name,
        abn: validated.abn || null,
        jurisdiction: validated.jurisdiction || null,
        industry: validated.industry || null,
        indigenousOwnership: validated.indigenousOwnership,
        turnover: validated.turnover || null,
        tradingDuration: validated.tradingDuration || null,
        employeeCount: validated.employeeCount ?? null,
        description: validated.description || null,
      },
    });

    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update company";
    return { success: false, error: message };
  }
}

// ─── Create User Account ──────────────────────────────

export type CreateUserData = {
  email: string;
  password: string;
  fullName?: string;
  companyId: string;
};

export async function createUserAccount(
  data: CreateUserData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = createUserSchema.safeParse(data);
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

    // Check if email already exists in profiles
    const existingProfile = await prisma.profile.findUnique({
      where: { email: validated.email },
    });
    if (existingProfile) {
      return { success: false, error: "A user with this email already exists" };
    }

    // Try admin client first, fall back to regular signUp
    const adminClient = createAdminClient();

    let authUserId: string;

    if (adminClient) {
      // Use admin API to create user (doesn't send confirmation email, doesn't affect current session)
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email: validated.email,
          password: validated.password,
          email_confirm: true,
        });

      if (authError) {
        return { success: false, error: authError.message };
      }

      authUserId = authData.user.id;
    } else {
      // Fallback: use regular signUp via server-side client
      const supabase = await createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Failed to create auth user" };
      }

      authUserId = authData.user.id;
    }

    // Create the profile record linked to the company
    await prisma.profile.create({
      data: {
        authId: authUserId,
        email: validated.email,
        fullName: validated.fullName || null,
        role: "USER",
        companyId: validated.companyId,
      },
    });

    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user account";
    return { success: false, error: message };
  }
}
