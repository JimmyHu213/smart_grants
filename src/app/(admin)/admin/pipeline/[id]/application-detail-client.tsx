"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Clock,
  MapPin,
  ExternalLink,
  Star,
  Loader2,
  Save,
} from "lucide-react";
import { StatusStepper } from "@/components/status-stepper";
import { DocumentManager } from "@/components/document-manager";
import { EligibilityPanel } from "@/components/eligibility-panel";
import {
  updateApplicationStatus,
  updateApplicationNotes,
} from "@/lib/actions/applications";
import { getAllowedNextStatuses } from "@/lib/validation";
import type { EligibilityResult } from "@/lib/validation";
import type { ApplicationStatus } from "@/generated/prisma/browser";

// ─── Types ─────────────────────────────────────────────

type DocumentRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  checklistItemId: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: {
    fullName: string | null;
    email: string;
  };
  checklistItem: {
    label: string;
  } | null;
};

type ChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
};

type ProcessStep = {
  id: string;
  label: string;
  sortOrder: number;
};

type CompanyInfo = {
  id: string;
  name: string;
  abn: string | null;
  jurisdiction: string | null;
  industry: string | null;
  indigenousOwnership: boolean;
  turnover: string | null;
  tradingDuration: string | null;
  employeeCount: number | null;
  description: string | null;
};

type GrantInfo = {
  id: string;
  name: string;
  jurisdiction: string;
  administeringBody: string;
  amount: string;
  status: string;
  deadline: string | null;
  externalLink: string | null;
  relevanceRating: number | null;
  description: string;
  checklistItems: ChecklistItem[];
  processSteps: ProcessStep[];
};

export type ApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  eligibilityResult: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  company: CompanyInfo;
  grant: GrantInfo;
  documents: DocumentRecord[];
};

// ─── Status Display ────────────��─────────────────────

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  RESEARCHING: "Researching",
  DRAFTING: "Drafting",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NOT_STARTED: { variant: "outline" },
  RESEARCHING: { variant: "secondary" },
  DRAFTING: { variant: "secondary" },
  SUBMITTED: { variant: "default" },
  UNDER_REVIEW: { variant: "default" },
  APPROVED: { variant: "default" },
  REJECTED: { variant: "destructive" },
  CLOSED: { variant: "outline" },
};

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

// ─── Component ────────────────────────────────────────

export function ApplicationDetailClient({
  application,
  isAdmin,
}: {
  application: ApplicationDetail;
  isAdmin: boolean;
}) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(application.status);

  const allowedStatuses = getAllowedNextStatuses(currentStatus);

  async function handleStatusChange(newStatus: ApplicationStatus) {
    const result = await updateApplicationStatus({
      applicationId: application.id,
      status: newStatus,
    });

    if (result.success) {
      setCurrentStatus(newStatus);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus] ?? newStatus}`);
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const result = await updateApplicationNotes({
      applicationId: application.id,
      notes,
    });
    setSavingNotes(false);

    if (result.success) {
      toast.success("Notes saved");
    } else {
      toast.error(result.error ?? "Failed to save notes");
    }
  }

  const externalUrl = application.grant.externalLink
    ? application.grant.externalLink.startsWith("http")
      ? application.grant.externalLink
      : `https://${application.grant.externalLink}`
    : null;

  const docsUploaded = application.documents.length;
  const checklistTotal = application.grant.checklistItems.length;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href={isAdmin ? "/admin/pipeline" : "/dashboard"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {isAdmin ? "Pipeline" : "Dashboard"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight leading-snug">
            {application.grant.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{application.grant.jurisdiction}</Badge>
            <Badge
              variant={
                STATUS_CONFIG[currentStatus]?.variant ?? "outline"
              }
            >
              {STATUS_LABELS[currentStatus] ?? currentStatus}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {application.company.name}
            </span>
          </div>
        </div>

        {/* Status Change (Admin only) */}
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor="status-select" className="text-sm text-muted-foreground whitespace-nowrap">
              Status:
            </Label>
            <Select
              value={currentStatus}
              onValueChange={(val) =>
                handleStatusChange(val as ApplicationStatus)
              }
            >
              <SelectTrigger id="status-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusStepper currentStatus={currentStatus} />
        </CardContent>
      </Card>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Documents + Eligibility */}
        <div className="space-y-6">
          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  Documents
                  {checklistTotal > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({docsUploaded} / {checklistTotal} uploaded)
                    </span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentManager
                applicationId={application.id}
                checklistItems={application.grant.checklistItems}
                documents={application.documents}
                isAdmin={isAdmin}
                canUpload={true}
              />
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                AI Eligibility Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <EligibilityPanel
                  applicationId={application.id}
                  grantName={application.grant.name}
                  companyName={application.company.name}
                  existingResult={
                    application.eligibilityResult as EligibilityResult | null
                  }
                />
              ) : application.eligibilityResult ? (
                <EligibilityPanel
                  applicationId={application.id}
                  grantName={application.grant.name}
                  companyName={application.company.name}
                  existingResult={
                    application.eligibilityResult as EligibilityResult | null
                  }
                />
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No eligibility assessment has been run yet. Your administrator
                  will assess eligibility when ready.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Grant info + Company + Notes */}
        <div className="space-y-6">
          {/* Grant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Grant Information</span>
                <Link
                  href={
                    isAdmin
                      ? `/admin/grants/${application.grant.id}`
                      : `/dashboard/grants/${application.grant.id}`
                  }
                  className="text-xs text-primary hover:underline font-normal"
                >
                  View Full Details
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">
                    {application.grant.amount}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Jurisdiction</p>
                  <p className="text-sm font-medium">
                    {JURISDICTION_LABELS[application.grant.jurisdiction] ??
                      application.grant.jurisdiction}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Administering Body
                  </p>
                  <p className="text-sm font-medium">
                    {application.grant.administeringBody}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium">
                    {application.grant.deadline ?? "Not specified"}
                  </p>
                </div>
              </div>

              {externalUrl && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        External Link
                      </p>
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {application.grant.externalLink}
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* Process Steps */}
              {application.grant.processSteps.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Application Process
                    </p>
                    <div className="space-y-2">
                      {application.grant.processSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{application.company.name}</span>
                </div>
                {application.company.abn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ABN</span>
                    <span>{application.company.abn}</span>
                  </div>
                )}
                {application.company.jurisdiction && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{application.company.jurisdiction}</span>
                  </div>
                )}
                {application.company.industry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry</span>
                    <span>{application.company.industry}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Indigenous Ownership
                  </span>
                  <span>
                    {application.company.indigenousOwnership ? "Yes" : "No"}
                  </span>
                </div>
                {application.company.turnover && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnover</span>
                    <span>{application.company.turnover}</span>
                  </div>
                )}
                {application.company.tradingDuration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trading Duration</span>
                    <span>{application.company.tradingDuration}</span>
                  </div>
                )}
                {application.company.employeeCount !== null &&
                  application.company.employeeCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employees</span>
                      <span>{application.company.employeeCount}</span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Add internal notes about this application..."
                    aria-label="Application notes"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : application.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {application.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notes have been added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
