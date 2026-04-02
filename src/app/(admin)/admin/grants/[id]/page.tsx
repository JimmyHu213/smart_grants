import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GrantDetailClient } from "./grant-detail-client";

type Params = Promise<{ id: string }>;

export default async function AdminGrantDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const grant = await prisma.grant.findUnique({
    where: { id },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      processSteps: { orderBy: { sortOrder: "asc" } },
      _count: { select: { applications: true } },
    },
  });

  if (!grant) {
    notFound();
  }

  const serialised = {
    ...grant,
    createdAt: grant.createdAt.toISOString(),
    updatedAt: grant.updatedAt.toISOString(),
    checklistItems: grant.checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      sortOrder: item.sortOrder,
      grantId: item.grantId,
    })),
    processSteps: grant.processSteps.map((step) => ({
      id: step.id,
      label: step.label,
      sortOrder: step.sortOrder,
      grantId: step.grantId,
    })),
  };

  return <GrantDetailClient grant={serialised} isAdmin={true} />;
}
