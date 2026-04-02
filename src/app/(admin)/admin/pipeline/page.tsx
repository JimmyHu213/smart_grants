import { prisma } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/client";
import { PipelinePageClient } from "./pipeline-page-client";

type SearchParams = Promise<{
  status?: string;
  company?: string;
}>;

const VALID_STATUSES = new Set([
  "NOT_STARTED",
  "RESEARCHING",
  "DRAFTING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CLOSED",
]);

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusParam = params.status;
  const companyParam = params.company;

  // Build filter
  const where: {
    status?: ApplicationStatus;
    companyId?: string;
  } = {};

  if (statusParam && VALID_STATUSES.has(statusParam)) {
    where.status = statusParam as ApplicationStatus;
  }
  if (companyParam && companyParam !== "ALL") {
    where.companyId = companyParam;
  }

  // Fetch applications with all relations needed for pipeline + documents + eligibility
  const applications = await prisma.grantApplication.findMany({
    where,
    include: {
      company: {
        select: { id: true, name: true },
      },
      grant: {
        select: {
          id: true,
          name: true,
          jurisdiction: true,
          deadline: true,
          status: true,
          _count: { select: { checklistItems: true } },
          checklistItems: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true, sortOrder: true },
          },
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: { fullName: true, email: true },
          },
          checklistItem: {
            select: { label: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { documents: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  // Fetch companies and grants for the assign dialog
  const [companies, grants] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.grant.findMany({
      select: { id: true, name: true, jurisdiction: true },
      where: { status: { not: "CLOSED" } },
      orderBy: [{ jurisdiction: "asc" }, { name: "asc" }],
    }),
  ]);

  // Serialise dates and eligibilityResult for client
  const serialisedApplications = applications.map((app) => ({
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    eligibilityResult: app.eligibilityResult as Record<string, unknown> | null,
    documents: app.documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
    })),
  }));

  return (
    <PipelinePageClient
      applications={serialisedApplications}
      companies={companies}
      grants={grants}
      currentStatusFilter={statusParam ?? "ALL"}
      currentCompanyFilter={companyParam ?? "ALL"}
    />
  );
}
