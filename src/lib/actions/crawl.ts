"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { crawlerResponseSchema } from "@/lib/validation";
import type { CrawlerResponse } from "@/lib/validation";

export type CrawlSummary = {
  new: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: string[];
};

export async function triggerCrawl(
  sources: string[]
): Promise<{ success: boolean; data?: CrawlSummary; error?: string }> {
  try {
    await requireAdmin();

    const crawlerUrl = process.env.CRAWLER_SERVICE_URL;
    const crawlerKey = process.env.CRAWLER_API_KEY;

    if (!crawlerUrl || !crawlerKey) {
      return { success: false, error: "Crawler service not configured" };
    }

    const response = await fetch(`${crawlerUrl}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": crawlerKey,
      },
      body: JSON.stringify({ sources }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Crawler service returned ${response.status}`,
      };
    }

    const json = await response.json();
    const parsed = crawlerResponseSchema.safeParse(json);

    if (!parsed.success) {
      return { success: false, error: "Invalid response from crawler service" };
    }

    const summary = await processCrawlerResults(parsed.data);

    revalidatePath("/admin/grants");
    return { success: true, data: summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger crawl";
    return { success: false, error: message };
  }
}

export async function processCrawlerResults(
  response: CrawlerResponse
): Promise<CrawlSummary> {
  const summary: CrawlSummary = {
    new: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    errors: [...response.errors],
  };

  for (const grant of response.grants) {
    const existing = await prisma.grant.findFirst({
      where: { sourceUrl: grant.sourceUrl },
      select: { id: true, reviewStatus: true, source: true },
    });

    // Skip rejected grants
    if (existing?.reviewStatus === "REJECTED") {
      summary.skipped++;
      continue;
    }

    // Skip manually edited grants
    if (existing?.source === "MANUAL") {
      summary.skipped++;
      continue;
    }

    if (!existing) {
      // New grant — create as PENDING_REVIEW
      await prisma.$transaction(async (tx) => {
        await tx.grant.create({
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
      });
      summary.new++;
    } else {
      // Existing grant — update and flag for review
      await prisma.$transaction(async (tx) => {
        await tx.grant.update({
          where: { id: existing.id },
          data: {
            name: grant.name,
            administeringBody: grant.administeringBody,
            amount: grant.amount,
            status: grant.status as "OPEN" | "CLOSED" | "MONITORING",
            deadline: grant.deadline || null,
            externalLink: grant.externalLink || null,
            description: grant.description,
            eligibilityCriteria: grant.eligibilityCriteria || null,
            reviewStatus: "PENDING_REVIEW",
            crawledAt: new Date(),
          },
        });

        await tx.grantChecklistItem.deleteMany({ where: { grantId: existing.id } });
        await tx.grantProcessStep.deleteMany({ where: { grantId: existing.id } });

        if (grant.checklistItems.length > 0) {
          await tx.grantChecklistItem.createMany({
            data: grant.checklistItems.map((item) => ({
              grantId: existing.id,
              label: item.label,
              sortOrder: item.sortOrder,
            })),
          });
        }

        if (grant.processSteps.length > 0) {
          await tx.grantProcessStep.createMany({
            data: grant.processSteps.map((step) => ({
              grantId: existing.id,
              label: step.label,
              sortOrder: step.sortOrder,
            })),
          });
        }
      });
      summary.updated++;
    }
  }

  return summary;
}
