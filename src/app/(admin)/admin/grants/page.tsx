import { prisma } from "@/lib/db";
import type { Jurisdiction, GrantStatus, Prisma } from "@/generated/prisma/client";
import { GrantsPageClient } from "./grants-page-client";

type SearchParams = Promise<{
  jurisdiction?: string;
  status?: string;
  q?: string;
}>;

const VALID_JURISDICTIONS = new Set([
  "FEDERAL", "WA", "NT", "QLD", "NSW", "VIC", "SA", "TAS", "ACT",
]);

const VALID_STATUSES = new Set(["OPEN", "CLOSED", "MONITORING"]);

export default async function AdminGrantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const jurisdictionParam = params.jurisdiction;
  const statusParam = params.status;
  const searchQuery = params.q?.trim() ?? "";

  const where: Prisma.GrantWhereInput = {};

  if (jurisdictionParam && VALID_JURISDICTIONS.has(jurisdictionParam)) {
    where.jurisdiction = jurisdictionParam as Jurisdiction;
  }
  if (statusParam && VALID_STATUSES.has(statusParam)) {
    where.status = statusParam as GrantStatus;
  }

  // Text search across name and description
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
      { administeringBody: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const grants = await prisma.grant.findMany({
    where,
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      processSteps: { orderBy: { sortOrder: "asc" } },
      _count: { select: { applications: true } },
    },
    orderBy: [{ jurisdiction: "asc" }, { name: "asc" }],
  });

  // Serialise dates for client component
  const serialisedGrants = grants.map((grant) => ({
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
  }));

  return (
    <GrantsPageClient
      grants={serialisedGrants}
      currentJurisdiction={jurisdictionParam ?? "ALL"}
      currentStatus={statusParam ?? "ALL"}
      currentSearch={searchQuery}
    />
  );
}
