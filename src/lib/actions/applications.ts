"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  updateApplicationNotesSchema,
  isValidStatusTransition,
} from "@/lib/validation";
import type { ApplicationStatus } from "@/generated/prisma/client";

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Assign Grant to Company Pipeline ─────────────────

export async function createApplication(data: {
  companyId: string;
  grantId: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = createApplicationSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    // Check for existing application (unique constraint)
    const existing = await prisma.grantApplication.findUnique({
      where: {
        companyId_grantId: {
          companyId: validated.companyId,
          grantId: validated.grantId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "This grant is already assigned to this company's pipeline",
      };
    }

    // Verify company and grant exist
    const [company, grant] = await Promise.all([
      prisma.company.findUnique({ where: { id: validated.companyId } }),
      prisma.grant.findUnique({ where: { id: validated.grantId } }),
    ]);

    if (!company) {
      return { success: false, error: "Company not found" };
    }
    if (!grant) {
      return { success: false, error: "Grant not found" };
    }

    await prisma.grantApplication.create({
      data: {
        companyId: validated.companyId,
        grantId: validated.grantId,
        notes: validated.notes || null,
        status: "NOT_STARTED",
      },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/admin/companies");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign grant";
    return { success: false, error: message };
  }
}

// ─── Update Application Status ────────────────────────

export async function updateApplicationStatus(data: {
  applicationId: string;
  status: ApplicationStatus;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = updateApplicationStatusSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    // Get current application
    const application = await prisma.grantApplication.findUnique({
      where: { id: validated.applicationId },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    // Validate status transition
    if (!isValidStatusTransition(application.status, validated.status)) {
      return {
        success: false,
        error: `Cannot transition from ${application.status.replace(/_/g, " ")} to ${validated.status.replace(/_/g, " ")}`,
      };
    }

    await prisma.grantApplication.update({
      where: { id: validated.applicationId },
      data: { status: validated.status as ApplicationStatus },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath(`/admin/pipeline/${validated.applicationId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/applications/${validated.applicationId}`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update status";
    return { success: false, error: message };
  }
}

// ─── Update Application Notes ─────────────────────────

export async function updateApplicationNotes(data: {
  applicationId: string;
  notes: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = updateApplicationNotesSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    const application = await prisma.grantApplication.findUnique({
      where: { id: validated.applicationId },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    await prisma.grantApplication.update({
      where: { id: validated.applicationId },
      data: { notes: validated.notes || null },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath(`/admin/pipeline/${validated.applicationId}`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update notes";
    return { success: false, error: message };
  }
}
