"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  CheckSquare,
  ListOrdered,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Pencil,
  Info,
} from "lucide-react";
import { GrantFormDialog } from "../grant-form-dialog";
import type { Jurisdiction, GrantStatus } from "@/generated/prisma/browser";

// ─── Types ─────────────────────────────────────────────

type ChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
  grantId: string;
};

type ProcessStep = {
  id: string;
  label: string;
  sortOrder: number;
  grantId: string;
};

export type GrantDetail = {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  administeringBody: string;
  amount: string;
  status: GrantStatus;
  deadline: string | null;
  externalLink: string | null;
  relevanceRating: number | null;
  description: string;
  eligibilityCriteria: string | null;
  createdAt: string;
  updatedAt: string;
  checklistItems: ChecklistItem[];
  processSteps: ProcessStep[];
  _count: { applications: number };
};

// ─── Helpers ──────────────────────────────────────────

function statusBadgeVariant(
  status: GrantStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "OPEN":
      return "default";
    case "MONITORING":
      return "secondary";
    case "CLOSED":
      return "destructive";
    default:
      return "outline";
  }
}

const JURISDICTION_LABELS: Record<string, string> = {
  FEDERAL: "Federal",
  WA: "Western Australia",
  NT: "Northern Territory",
  QLD: "Queensland",
  NSW: "New South Wales",
  VIC: "Victoria",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
};

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">Not rated</span>;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          }`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1.5 text-sm text-muted-foreground">{rating}/5</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────

export function GrantDetailClient({
  grant,
  isAdmin,
}: {
  grant: GrantDetail;
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  const externalUrl = grant.externalLink
    ? grant.externalLink.startsWith("http")
      ? grant.externalLink
      : `https://${grant.externalLink}`
    : null;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href={isAdmin ? "/admin/grants" : "/dashboard"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {isAdmin ? "Grants" : "Dashboard"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight leading-snug">
            {grant.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{grant.jurisdiction}</Badge>
            <Badge variant={statusBadgeVariant(grant.status)}>
              {grant.status}
            </Badge>
            {grant._count.applications > 0 && (
              <span className="text-xs text-muted-foreground">
                {grant._count.applications} application
                {grant._count.applications !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {externalUrl && (
            <Button
              variant="outline"
              size="sm"
              render={
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Platform
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Grant
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Description + Eligibility */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {grant.description}
              </p>
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          {grant.eligibilityCriteria && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-primary" aria-hidden="true" />
                  Eligibility Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {grant.eligibilityCriteria}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                Document Checklist
                {grant.checklistItems.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({grant.checklistItems.length} item
                    {grant.checklistItems.length !== 1 ? "s" : ""})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grant.checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No checklist items defined for this grant.
                </p>
              ) : (
                <ol className="space-y-2">
                  {grant.checklistItems.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Process Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListOrdered className="h-4 w-4 text-primary" aria-hidden="true" />
                Application Process
                {grant.processSteps.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({grant.processSteps.length} step
                    {grant.processSteps.length !== 1 ? "s" : ""})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grant.processSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No process steps defined for this grant.
                </p>
              ) : (
                <div className="space-y-3">
                  {grant.processSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {index + 1}
                        </div>
                        {index < grant.processSteps.length - 1 && (
                          <div className="mt-1 h-4 w-px bg-border" />
                        )}
                      </div>
                      <p className="text-sm pt-0.5">{step.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details sidebar */}
        <div className="space-y-6">
          {/* Key Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount */}
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">{grant.amount}</p>
                </div>
              </div>

              <Separator />

              {/* Jurisdiction */}
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Jurisdiction</p>
                  <p className="text-sm font-medium">
                    {JURISDICTION_LABELS[grant.jurisdiction] ?? grant.jurisdiction}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Administering Body */}
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Administering Body
                  </p>
                  <p className="text-sm font-medium">
                    {grant.administeringBody}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Deadline */}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium">
                    {grant.deadline ?? "Not specified"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Relevance Rating */}
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Relevance Rating
                </p>
                <RatingStars rating={grant.relevanceRating} />
              </div>
            </CardContent>
          </Card>

          {/* External Link Card */}
          {externalUrl && (
            <Card>
              <CardContent className="p-4">
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{grant.externalLink}</span>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {isAdmin && (
        <GrantFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          grant={grant}
        />
      )}
    </div>
  );
}
