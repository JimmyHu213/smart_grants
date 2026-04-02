"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Jurisdiction, GrantStatus } from "@/generated/prisma/client";

// ─── Types ─────────────────────────────────────────────

export type ChecklistItemInput = {
  id?: string;
  label: string;
  sortOrder: number;
};

export type ProcessStepInput = {
  id?: string;
  label: string;
  sortOrder: number;
};

export type GrantFormData = {
  name: string;
  jurisdiction: Jurisdiction;
  administeringBody: string;
  amount: string;
  status: GrantStatus;
  deadline: string;
  externalLink: string;
  relevanceRating: number;
  description: string;
  eligibilityCriteria: string;
  checklistItems: ChecklistItemInput[];
  processSteps: ProcessStepInput[];
};

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Create ────────────────────────────────────────────

export async function createGrant(data: GrantFormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.grant.create({
      data: {
        name: data.name,
        jurisdiction: data.jurisdiction,
        administeringBody: data.administeringBody,
        amount: data.amount,
        status: data.status,
        deadline: data.deadline || null,
        externalLink: data.externalLink || null,
        relevanceRating: data.relevanceRating || null,
        description: data.description,
        eligibilityCriteria: data.eligibilityCriteria || null,
        checklistItems: {
          create: data.checklistItems.map((item) => ({
            label: item.label,
            sortOrder: item.sortOrder,
          })),
        },
        processSteps: {
          create: data.processSteps.map((step) => ({
            label: step.label,
            sortOrder: step.sortOrder,
          })),
        },
      },
    });

    revalidatePath("/admin/grants");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create grant";
    return { success: false, error: message };
  }
}

// ─── Update ────────────────────────────────────────────

export async function updateGrant(
  id: string,
  data: GrantFormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    // Update grant and replace checklist items and process steps
    await prisma.$transaction(async (tx) => {
      // Update the grant itself
      await tx.grant.update({
        where: { id },
        data: {
          name: data.name,
          jurisdiction: data.jurisdiction,
          administeringBody: data.administeringBody,
          amount: data.amount,
          status: data.status,
          deadline: data.deadline || null,
          externalLink: data.externalLink || null,
          relevanceRating: data.relevanceRating || null,
          description: data.description,
          eligibilityCriteria: data.eligibilityCriteria || null,
        },
      });

      // Delete existing checklist items and process steps, then recreate
      await tx.grantChecklistItem.deleteMany({ where: { grantId: id } });
      await tx.grantProcessStep.deleteMany({ where: { grantId: id } });

      if (data.checklistItems.length > 0) {
        await tx.grantChecklistItem.createMany({
          data: data.checklistItems.map((item) => ({
            grantId: id,
            label: item.label,
            sortOrder: item.sortOrder,
          })),
        });
      }

      if (data.processSteps.length > 0) {
        await tx.grantProcessStep.createMany({
          data: data.processSteps.map((step) => ({
            grantId: id,
            label: step.label,
            sortOrder: step.sortOrder,
          })),
        });
      }
    });

    revalidatePath("/admin/grants");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update grant";
    return { success: false, error: message };
  }
}

// ─── Delete ────────────────────────────────────────────

export async function deleteGrant(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.grant.delete({ where: { id } });

    revalidatePath("/admin/grants");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete grant";
    return { success: false, error: message };
  }
}
