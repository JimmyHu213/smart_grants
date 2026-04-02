"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { documentUploadSchema, deleteDocumentSchema } from "@/lib/validation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Save Document Metadata ──────────────────────────

export async function saveDocumentMetadata(data: {
  applicationId: string;
  checklistItemId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = documentUploadSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const validated = parsed.data;

    // Verify application exists and user has access
    const application = await prisma.grantApplication.findUnique({
      where: { id: validated.applicationId },
      select: { id: true, companyId: true },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    // Users can only upload to their own company's applications
    if (user.role !== "ADMIN" && application.companyId !== user.companyId) {
      return { success: false, error: "You do not have access to this application" };
    }

    // Verify checklist item belongs to the grant (if provided)
    if (validated.checklistItemId) {
      const appWithGrant = await prisma.grantApplication.findUnique({
        where: { id: validated.applicationId },
        select: { grantId: true },
      });

      if (appWithGrant) {
        const checklistItem = await prisma.grantChecklistItem.findFirst({
          where: {
            id: validated.checklistItemId,
            grantId: appWithGrant.grantId,
          },
        });

        if (!checklistItem) {
          return { success: false, error: "Checklist item not found for this grant" };
        }
      }
    }

    await prisma.document.create({
      data: {
        applicationId: validated.applicationId,
        checklistItemId: validated.checklistItemId || null,
        fileName: validated.fileName,
        fileUrl: validated.fileUrl,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        uploadedById: user.id,
      },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save document";
    return { success: false, error: message };
  }
}

// ─── Delete Document (Admin only) ────────────────────

export async function deleteDocument(data: {
  documentId: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = deleteDocumentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const document = await prisma.document.findUnique({
      where: { id: parsed.data.documentId },
      select: { id: true, fileUrl: true },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Delete from Supabase Storage
    const adminClient = createAdminClient();
    if (adminClient && document.fileUrl) {
      await adminClient.storage
        .from("documents")
        .remove([document.fileUrl]);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id: parsed.data.documentId },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete document";
    return { success: false, error: message };
  }
}

// ─── Generate Signed Download URL ────────────────────

export async function getSignedDownloadUrl(
  fileUrl: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { url: null, error: "Not authenticated" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(fileUrl, 3600); // 1 hour expiry

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate download URL";
    return { url: null, error: message };
  }
}

// ─── Get Upload URL ──────────────────────────────────
// Generate a signed upload URL for the client to upload directly to Supabase Storage

export async function getSignedUploadUrl(data: {
  applicationId: string;
  fileName: string;
}): Promise<{ path: string | null; token: string | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { path: null, token: null, error: "Not authenticated" };
    }

    // Verify application access
    const application = await prisma.grantApplication.findUnique({
      where: { id: data.applicationId },
      select: { id: true, companyId: true },
    });

    if (!application) {
      return { path: null, token: null, error: "Application not found" };
    }

    if (user.role !== "ADMIN" && application.companyId !== user.companyId) {
      return { path: null, token: null, error: "You do not have access to this application" };
    }

    // Build storage path: companyId/applicationId/timestamp-filename
    const timestamp = Date.now();
    const sanitisedName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${application.companyId}/${data.applicationId}/${timestamp}-${sanitisedName}`;

    const supabase = await createClient();
    const { data: uploadData, error } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(path);

    if (error) {
      return { path: null, token: null, error: error.message };
    }

    return { path, token: uploadData.token };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate upload URL";
    return { path: null, token: null, error: message };
  }
}
