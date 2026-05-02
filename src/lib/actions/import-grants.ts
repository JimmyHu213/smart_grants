"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { crawledGrantSchema } from "@/lib/validation";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import * as XLSX from "xlsx";

export type ImportSummary = {
  new: number;
  skipped: number;
  errors: string[];
};

const SYSTEM_PROMPT = `You are a data extraction assistant. You will receive raw spreadsheet data about Australian grants.
Extract each grant and return a JSON array of objects with these exact fields:

- name (string, required): Official grant program name
- jurisdiction (string, required): One of FEDERAL, WA, NT, QLD, NSW, VIC, SA, TAS, ACT
- administeringBody (string, required): The department or agency administering the grant
- amount (string, required): Funding amount as text (e.g. "Up to $50,000")
- status (string, required): One of OPEN, CLOSED, MONITORING
- deadline (string): Application deadline as text, or empty string
- externalLink (string): URL to grant info page, or empty string
- sourceUrl (string, required): A unique identifier URL for this grant (use the externalLink if available, otherwise construct one from the grant name)
- description (string, required): 2-4 sentence summary of the grant
- eligibilityCriteria (string): Who is eligible, or empty string
- checklistItems (array): Required documents, each with "label" (string) and "sortOrder" (number, 1-indexed). Empty array if unknown.
- processSteps (array): Application steps, each with "label" (string) and "sortOrder" (number, 1-indexed). Empty array if unknown.

Rules:
- Return ONLY a valid JSON array, no markdown, no explanation
- Every grant must have name, jurisdiction, administeringBody, amount, status, sourceUrl, and description
- If jurisdiction is unclear, use FEDERAL
- If status is unclear, use MONITORING
- If a field is missing, use empty string for text fields and empty arrays for lists`;

export async function importGrantsFromExcel(
  formData: FormData
): Promise<{ success: boolean; data?: ImportSummary; error?: string }> {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file uploaded" };
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return { success: false, error: "File must be .xlsx, .xls, or .csv" };
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_csv(firstSheet);

    if (!rawData.trim()) {
      return { success: false, error: "Spreadsheet is empty" };
    }

    // Use AI to extract and normalise grant data
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      prompt: `Extract grants from this spreadsheet data:\n\n${rawData}`,
    });

    // Parse AI response
    let grants: unknown[];
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      grants = JSON.parse(cleaned);
      if (!Array.isArray(grants)) {
        return { success: false, error: "AI did not return an array of grants" };
      }
    } catch {
      return { success: false, error: "Failed to parse AI response as JSON" };
    }

    // Validate and save each grant
    const summary: ImportSummary = { new: 0, skipped: 0, errors: [] };

    for (const raw of grants) {
      const parsed = crawledGrantSchema.safeParse(raw);
      if (!parsed.success) {
        const name = (raw as Record<string, unknown>)?.name ?? "Unknown";
        summary.errors.push(`${name}: ${parsed.error.issues[0]?.message}`);
        continue;
      }

      const grant = parsed.data;

      // Check for duplicates by sourceUrl
      const existing = await prisma.grant.findFirst({
        where: { sourceUrl: grant.sourceUrl },
        select: { id: true },
      });

      if (existing) {
        summary.skipped++;
        continue;
      }

      // Also check by name to avoid near-duplicates
      const nameMatch = await prisma.grant.findFirst({
        where: { name: grant.name },
        select: { id: true },
      });

      if (nameMatch) {
        summary.skipped++;
        continue;
      }

      await prisma.grant.create({
        data: {
          name: grant.name,
          jurisdiction: grant.jurisdiction as "FEDERAL" | "WA" | "NT" | "QLD" | "NSW" | "VIC" | "SA" | "TAS" | "ACT",
          administeringBody: grant.administeringBody,
          amount: grant.amount,
          status: grant.status as "OPEN" | "CLOSED" | "MONITORING",
          deadline: grant.deadline || null,
          externalLink: grant.externalLink || null,
          description: grant.description,
          eligibilityCriteria: grant.eligibilityCriteria || null,
          source: "CRAWLED",
          reviewStatus: "PENDING_REVIEW",
          sourceUrl: grant.sourceUrl,
          crawledAt: new Date(),
          checklistItems: {
            create: grant.checklistItems.map((item) => ({
              label: item.label,
              sortOrder: item.sortOrder,
            })),
          },
          processSteps: {
            create: grant.processSteps.map((step) => ({
              label: step.label,
              sortOrder: step.sortOrder,
            })),
          },
        },
      });
      summary.new++;
    }

    revalidatePath("/admin/grants");
    return { success: true, data: summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import grants";
    return { success: false, error: message };
  }
}
