import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationDetailClient } from "@/app/(admin)/admin/pipeline/[id]/application-detail-client";

type Params = Promise<{ id: string }>;

export default async function UserApplicationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const application = await prisma.grantApplication.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          abn: true,
          jurisdiction: true,
          industry: true,
          indigenousOwnership: true,
          turnover: true,
          tradingDuration: true,
          employeeCount: true,
          description: true,
        },
      },
      grant: {
        include: {
          checklistItems: { orderBy: { sortOrder: "asc" } },
          processSteps: { orderBy: { sortOrder: "asc" } },
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
    },
  });

  if (!application) {
    notFound();
  }

  // Ensure user can only view their own company's applications
  if (user.companyId !== application.companyId) {
    notFound();
  }

  // Serialise dates and JSON
  const serialised = {
    id: application.id,
    status: application.status,
    notes: application.notes,
    eligibilityResult: application.eligibilityResult as Record<string, unknown> | null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    company: application.company,
    grant: {
      id: application.grant.id,
      name: application.grant.name,
      jurisdiction: application.grant.jurisdiction,
      administeringBody: application.grant.administeringBody,
      amount: application.grant.amount,
      status: application.grant.status,
      deadline: application.grant.deadline,
      externalLink: application.grant.externalLink,
      relevanceRating: application.grant.relevanceRating,
      description: application.grant.description,
      checklistItems: application.grant.checklistItems.map((item) => ({
        id: item.id,
        label: item.label,
        sortOrder: item.sortOrder,
      })),
      processSteps: application.grant.processSteps.map((step) => ({
        id: step.id,
        label: step.label,
        sortOrder: step.sortOrder,
      })),
    },
    documents: application.documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      checklistItemId: doc.checklistItemId,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt.toISOString(),
      uploadedBy: doc.uploadedBy,
      checklistItem: doc.checklistItem,
    })),
  };

  return <ApplicationDetailClient application={serialised} isAdmin={false} />;
}
