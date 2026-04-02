import { prisma } from "@/lib/db";
import { CompaniesPageClient } from "./companies-page-client";

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      profiles: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Serialise dates for client component
  const serialisedCompanies = companies.map((company) => ({
    ...company,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  }));

  return <CompaniesPageClient companies={serialisedCompanies} />;
}
