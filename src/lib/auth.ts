import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  authId: string;
  email: string;
  role: Role;
  fullName: string | null;
  companyId: string | null;
};

/**
 * Get the current user's profile from the database.
 * Returns null if the user is not authenticated or has no profile.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { authId: user.id },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    authId: profile.authId,
    email: profile.email,
    role: profile.role,
    fullName: profile.fullName,
    companyId: profile.companyId,
  };
}

/**
 * Require the current user to be authenticated and have a specific role.
 * Throws an error if the user is not authenticated or has the wrong role.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (user.role !== role) {
    throw new Error("Insufficient permissions");
  }
  return user;
}

/**
 * Require the current user to be an admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("ADMIN");
}
