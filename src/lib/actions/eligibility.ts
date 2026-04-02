"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { idSchema, eligibilitySchema } from "@/lib/validation";
import type { EligibilityResult } from "@/lib/validation";

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ─── Run AI Eligibility Assessment ───────────────────

export async function runEligibilityAssessment(data: {
  applicationId: string;
}): Promise<ActionResult & { result?: EligibilityResult }> {
  try {
    await requireAdmin();

    const idResult = idSchema.safeParse(data.applicationId);
    if (!idResult.success) {
      return { success: false, error: "Invalid application ID" };
    }

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to your environment variables to enable AI eligibility assessments.",
      };
    }

    // Fetch application with company and grant data
    const application = await prisma.grantApplication.findUnique({
      where: { id: data.applicationId },
      include: {
        company: true,
        grant: {
          include: {
            checklistItems: { orderBy: { sortOrder: "asc" } },
            processSteps: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    // Build the company profile summary
    const companyProfile = buildCompanyProfile(application.company);
    const grantCriteria = buildGrantCriteria(application.grant);

    // Call Claude via AI SDK
    const { generateText, Output } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");

    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      output: Output.object({ schema: eligibilitySchema }),
      prompt: `You are an Australian grants eligibility specialist. Assess whether the following company qualifies for the specified grant program.

## Company Profile
${companyProfile}

## Grant Program
${grantCriteria}

## Instructions
1. Evaluate the company against each eligibility criterion for this grant.
2. For each criterion, determine whether the company is "qualified", "partial" (partially meets criteria or more info needed), or "not_qualified".
3. Identify specific gaps — what is missing or needs attention.
4. Provide actionable recommendations for the company to improve their eligibility.
5. Give an overall fit score from 0 to 100 (100 = perfect fit, 0 = completely ineligible).
6. Write a brief summary of the assessment.

Be specific and practical. Reference Australian grant requirements and standards where relevant. If information is missing from the company profile, note it as a gap.`,
    });

    if (!output) {
      return {
        success: false,
        error: "AI did not return a valid eligibility assessment. Please try again.",
      };
    }

    // Save the result to the application record
    await prisma.grantApplication.update({
      where: { id: data.applicationId },
      data: {
        eligibilityResult: JSON.parse(JSON.stringify(output)),
      },
    });

    revalidatePath("/admin/pipeline");
    return { success: true, result: output };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run eligibility assessment";
    return { success: false, error: message };
  }
}

// ─── Helpers ──────────────────────────────────────────

function buildCompanyProfile(company: {
  name: string;
  abn: string | null;
  jurisdiction: string | null;
  industry: string | null;
  indigenousOwnership: boolean;
  turnover: string | null;
  tradingDuration: string | null;
  employeeCount: number | null;
  description: string | null;
}): string {
  const lines: string[] = [
    `Name: ${company.name}`,
  ];

  if (company.abn) lines.push(`ABN: ${company.abn}`);
  if (company.jurisdiction) lines.push(`Jurisdiction: ${company.jurisdiction}`);
  if (company.industry) lines.push(`Industry: ${company.industry}`);
  lines.push(`Indigenous Ownership: ${company.indigenousOwnership ? "Yes" : "No"}`);
  if (company.turnover) lines.push(`Annual Turnover: ${company.turnover}`);
  if (company.tradingDuration) lines.push(`Trading Duration: ${company.tradingDuration}`);
  if (company.employeeCount !== null) lines.push(`Employees: ${company.employeeCount}`);
  if (company.description) lines.push(`Description: ${company.description}`);

  return lines.join("\n");
}

function buildGrantCriteria(grant: {
  name: string;
  jurisdiction: string;
  administeringBody: string;
  amount: string;
  description: string;
  eligibilityCriteria: string | null;
  deadline: string | null;
  checklistItems: { label: string }[];
  processSteps: { label: string }[];
}): string {
  const lines: string[] = [
    `Name: ${grant.name}`,
    `Jurisdiction: ${grant.jurisdiction}`,
    `Administering Body: ${grant.administeringBody}`,
    `Amount: ${grant.amount}`,
    `Description: ${grant.description}`,
  ];

  if (grant.eligibilityCriteria) {
    lines.push(`\nEligibility Criteria:\n${grant.eligibilityCriteria}`);
  }

  if (grant.deadline) {
    lines.push(`Deadline: ${grant.deadline}`);
  }

  if (grant.checklistItems.length > 0) {
    lines.push(
      `\nRequired Documents:\n${grant.checklistItems.map((i) => `- ${i.label}`).join("\n")}`
    );
  }

  if (grant.processSteps.length > 0) {
    lines.push(
      `\nApplication Process:\n${grant.processSteps.map((s) => `- ${s.label}`).join("\n")}`
    );
  }

  return lines.join("\n");
}
