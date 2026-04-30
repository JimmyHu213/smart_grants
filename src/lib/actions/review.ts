"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { reviewActionSchema, bulkReviewActionSchema } from "@/lib/validation";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function reviewGrant(
  grantId: string,
  action: "approve" | "reject"
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = reviewActionSchema.safeParse({ grantId, action });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const reviewStatus = action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.grant.update({
      where: { id: grantId },
      data: { reviewStatus },
    });

    revalidatePath("/admin/grants");
    revalidatePath("/admin/grants/review");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to review grant";
    return { success: false, error: message };
  }
}

export async function bulkReviewGrants(
  grantIds: string[],
  action: "approve" | "reject"
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = bulkReviewActionSchema.safeParse({ grantIds, action });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const reviewStatus = action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.grant.updateMany({
      where: { id: { in: grantIds } },
      data: { reviewStatus },
    });

    revalidatePath("/admin/grants");
    revalidatePath("/admin/grants/review");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk review grants";
    return { success: false, error: message };
  }
}
