import { prisma } from "@/lib/db";
import { UsersPageClient } from "./users-page-client";

export default async function AdminUsersPage() {
  const profiles = await prisma.profile.findMany({
    include: {
      company: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialisedUsers = profiles.map((profile) => ({
    id: profile.id,
    authId: profile.authId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    role: profile.role,
    companyId: profile.companyId,
    companyName: profile.company?.name ?? null,
    createdAt: profile.createdAt.toISOString(),
  }));

  // Fetch all companies for the filter and edit dialogs
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <UsersPageClient users={serialisedUsers} companies={companies} />
  );
}
