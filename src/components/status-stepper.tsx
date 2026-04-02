"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const ALL_STATUSES = [
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "RESEARCHING", label: "Researching" },
  { key: "DRAFTING", label: "Drafting" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CLOSED", label: "Closed" },
] as const;

// For the visual stepper we show the "happy path" pipeline.
// REJECTED and CLOSED are treated as terminal states shown separately.
const PIPELINE_STATUSES = [
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "RESEARCHING", label: "Researching" },
  { key: "DRAFTING", label: "Drafting" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "APPROVED", label: "Approved" },
] as const;

function getStepState(
  stepKey: string,
  currentStatus: string
): "completed" | "current" | "upcoming" {
  const pipelineKeys = PIPELINE_STATUSES.map((s) => s.key);
  const currentIndex = pipelineKeys.indexOf(currentStatus as typeof pipelineKeys[number]);
  const stepIndex = pipelineKeys.indexOf(stepKey as typeof pipelineKeys[number]);

  // If current status is REJECTED or CLOSED, mark everything up to last known step
  if (currentStatus === "REJECTED" || currentStatus === "CLOSED") {
    // Everything in the pipeline is considered "past" for visual purposes
    return "completed";
  }

  if (currentIndex === -1 || stepIndex === -1) return "upcoming";
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const isTerminal = currentStatus === "REJECTED" || currentStatus === "CLOSED";

  return (
    <div className="space-y-3">
      {/* Pipeline steps */}
      <div className="flex items-center gap-0" role="list" aria-label="Application status progress">
        {PIPELINE_STATUSES.map((step, index) => {
          const state = getStepState(step.key, currentStatus);
          const isLast = index === PIPELINE_STATUSES.length - 1;

          return (
            <div
              key={step.key}
              className="flex flex-1 items-center"
              role="listitem"
              aria-current={state === "current" ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-1.5 flex-1">
                {/* Circle */}
                <div className="flex items-center w-full">
                  {/* Connector left */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 transition-colors",
                        state === "completed" || state === "current"
                          ? "bg-primary"
                          : "bg-border"
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      state === "completed" &&
                        "bg-primary text-primary-foreground",
                      state === "current" &&
                        "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                      state === "upcoming" &&
                        "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {state === "completed" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Connector right */}
                  {!isLast && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 transition-colors",
                        state === "completed" ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center max-w-[70px] sm:text-xs sm:max-w-none",
                    state === "current"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal status indicator */}
      {isTerminal && (
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
              currentStatus === "REJECTED"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                currentStatus === "REJECTED" ? "bg-destructive" : "bg-muted-foreground"
              )}
            />
            {currentStatus === "REJECTED" ? "Rejected" : "Closed"}
          </div>
        </div>
      )}
    </div>
  );
}

export { ALL_STATUSES, PIPELINE_STATUSES };
