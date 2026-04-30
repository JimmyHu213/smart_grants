import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ReviewPageClient } from "./review-page-client";

export default async function ReviewGrantsPage() {
  await requireAdmin();

  const pendingGrants = await prisma.grant.findMany({
    where: { reviewStatus: "PENDING_REVIEW" },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      processSteps: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { crawledAt: "desc" },
  });

  const serialised = pendingGrants.map((grant) => ({
    ...grant,
    createdAt: grant.createdAt.toISOString(),
    updatedAt: grant.updatedAt.toISOString(),
    crawledAt: grant.crawledAt?.toISOString() ?? null,
    checklistItems: grant.checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      sortOrder: item.sortOrder,
    })),
    processSteps: grant.processSteps.map((step) => ({
      id: step.id,
      label: step.label,
      sortOrder: step.sortOrder,
    })),
  }));

  return <ReviewPageClient grants={serialised} />;
}
