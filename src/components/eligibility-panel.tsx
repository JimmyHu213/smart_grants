"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Target,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { runEligibilityAssessment } from "@/lib/actions/eligibility";
import type { EligibilityResult } from "@/lib/actions/eligibility";

// ─── Types ─────────────────────────────────────────────

type EligibilityPanelProps = {
  applicationId: string;
  grantName: string;
  companyName: string;
  existingResult: EligibilityResult | null;
};

// ─── Score Gauge ──────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  // Determine colour based on score
  let colourClass = "text-red-400";
  let bgClass = "bg-red-400/20";
  let label = "Poor Fit";

  if (score >= 70) {
    colourClass = "text-emerald-400";
    bgClass = "bg-emerald-400/20";
    label = "Strong Fit";
  } else if (score >= 50) {
    colourClass = "text-amber-400";
    bgClass = "bg-amber-400/20";
    label = "Moderate Fit";
  } else if (score >= 30) {
    colourClass = "text-orange-400";
    bgClass = "bg-orange-400/20";
    label = "Weak Fit";
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${bgClass}`}
      >
        <span className={`text-2xl font-bold ${colourClass}`}>{score}</span>
      </div>
      <div>
        <p className={`text-lg font-semibold ${colourClass}`}>{label}</p>
        <p className="text-sm text-muted-foreground">Eligibility Score</p>
      </div>
    </div>
  );
}

// ─── Criterion Status Icon ───────────────────────────

function CriterionIcon({ status }: { status: string }) {
  switch (status) {
    case "qualified":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />;
    case "partial":
      return <AlertCircle className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    case "not_qualified":
      return <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />;
    default:
      return null;
  }
}

function criterionBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "qualified":
      return "default";
    case "partial":
      return "secondary";
    case "not_qualified":
      return "destructive";
    default:
      return "outline";
  }
}

function criterionLabel(status: string): string {
  switch (status) {
    case "qualified":
      return "Qualified";
    case "partial":
      return "Partial";
    case "not_qualified":
      return "Not Qualified";
    default:
      return status;
  }
}

// ─── Component ────────────────────────────────────────

export function EligibilityPanel({
  applicationId,
  grantName,
  companyName,
  existingResult,
}: EligibilityPanelProps) {
  const [result, setResult] = useState<EligibilityResult | null>(existingResult);
  const [running, setRunning] = useState(false);

  async function handleRunAssessment() {
    setRunning(true);
    try {
      const response = await runEligibilityAssessment({
        applicationId,
      });

      if (response.success && response.result) {
        setResult(response.result);
        toast.success("Eligibility assessment complete");
      } else {
        toast.error(response.error ?? "Assessment failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + Run Button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {grantName} &mdash; {companyName}
          </p>
        </div>
        <Button
          onClick={handleRunAssessment}
          disabled={running}
          variant={result ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {running
            ? "Assessing..."
            : result
              ? "Re-run Assessment"
              : "Run Assessment"}
        </Button>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-4">
          {/* Score */}
          <ScoreGauge score={result.overallScore} />

          {/* Summary */}
          <p className="text-sm leading-relaxed">{result.summary}</p>

          <Separator />

          {/* Per-Criterion Assessment */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4" aria-hidden="true" />
              Eligibility Criteria
            </h4>
            <div className="space-y-2">
              {result.criteria.map((criterion, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <CriterionIcon status={criterion.status} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {criterion.name}
                          </p>
                          <Badge
                            variant={criterionBadgeVariant(criterion.status)}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {criterionLabel(criterion.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {criterion.explanation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gaps */}
          {result.gaps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  Identified Gaps
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {result.gaps.map((gap, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                  Recommendations
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {result.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Brain className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">
              No eligibility assessment has been run yet. Click &ldquo;Run
              Assessment&rdquo; to evaluate this company&apos;s fit for the
              grant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
