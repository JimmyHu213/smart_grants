"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileCheck,
  Clock,
  Loader2,
  StickyNote,
  FolderOpen,
  Brain,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";

const JURISDICTION_FILTER_OPTIONS = [
  { value: "ALL", label: "All Jurisdictions" },
  { value: "FEDERAL", label: "Federal" },
  { value: "WA", label: "Western Australia" },
  { value: "NT", label: "Northern Territory" },
  { value: "QLD", label: "Queensland" },
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "ACT" },
];
import {
  updateApplicationStatus,
  updateApplicationNotes,
} from "@/lib/actions/applications";
import { getAllowedNextStatuses } from "@/lib/validation";
import { AssignGrantDialog } from "./assign-grant-dialog";
import { DocumentManager } from "@/components/document-manager";
import { EligibilityPanel } from "@/components/eligibility-panel";
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

export type ApplicationWithRelations = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  eligibilityResult: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  grant: {
    id: string;
    name: string;
    jurisdiction: string;
    deadline: string | null;
    status: string;
    _count: { checklistItems: number };
    checklistItems: ChecklistItem[];
  };
  documents: DocumentRecord[];
  _count: {
    documents: number;
  };
};

type CompanyOption = { id: string; name: string };
type GrantOption = { id: string; name: string; jurisdiction: string };

// ─── Status Display ───────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NOT_STARTED: { label: "Not Started", variant: "outline" },
  RESEARCHING: { label: "Researching", variant: "secondary" },
  DRAFTING: { label: "Drafting", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "default" },
  UNDER_REVIEW: { label: "Under Review", variant: "default" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CLOSED: { label: "Closed", variant: "outline" },
};

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

function statusBadge(status: string) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── All status filter options ────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "RESEARCHING", label: "Researching" },
  { value: "DRAFTING", label: "Drafting" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
];

// ─── Component ─────────────────────────────────────────

export function PipelinePageClient({
  applications,
  companies,
  grants,
  currentStatusFilter,
  currentCompanyFilter,
  currentJurisdictionFilter,
}: {
  applications: ApplicationWithRelations[];
  companies: CompanyOption[];
  grants: GrantOption[];
  currentStatusFilter: string;
  currentCompanyFilter: string;
  currentJurisdictionFilter: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editNotesTarget, setEditNotesTarget] =
    useState<ApplicationWithRelations | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [docsTarget, setDocsTarget] =
    useState<ApplicationWithRelations | null>(null);
  const [eligibilityTarget, setEligibilityTarget] =
    useState<ApplicationWithRelations | null>(null);

  // Status counts for summary
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/pipeline?${params.toString()}`);
  }

  async function handleStatusChange(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    const result = await updateApplicationStatus({
      applicationId,
      status: newStatus,
    });

    if (result.success) {
      toast.success("Status updated");
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
  }

  async function handleSaveNotes() {
    if (!editNotesTarget) return;
    setSavingNotes(true);

    const result = await updateApplicationNotes({
      applicationId: editNotesTarget.id,
      notes: notesValue,
    });

    setSavingNotes(false);

    if (result.success) {
      toast.success("Notes saved");
      setEditNotesTarget(null);
    } else {
      toast.error(result.error ?? "Failed to save notes");
    }
  }

  // Count active (non-closed) applications
  const activeCount = applications.filter(
    (a) => a.status !== "CLOSED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Application Pipeline
          </h2>
          <p className="text-sm text-muted-foreground">
            {applications.length} application
            {applications.length !== 1 ? "s" : ""} total, {activeCount} active
          </p>
        </div>
        <Button onClick={() => setAssignOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Grant
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-colors hover:border-primary/50 ${
              currentStatusFilter === status ? "border-primary" : ""
            }`}
            onClick={() =>
              updateFilter(
                "status",
                currentStatusFilter === status ? "ALL" : status
              )
            }
          >
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">
                {statusCounts[status] || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={currentStatusFilter}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentJurisdictionFilter}
          onValueChange={(val) => updateFilter("jurisdiction", val)}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by jurisdiction">
            <SelectValue placeholder="Jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            {JURISDICTION_FILTER_OPTIONS.map((j) => (
              <SelectItem key={j.value} value={j.value}>
                {j.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentCompanyFilter}
          onValueChange={(val) => updateFilter("company", val)}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by company">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(currentStatusFilter !== "ALL" ||
          currentCompanyFilter !== "ALL" ||
          currentJurisdictionFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/pipeline")}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Applications Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Grant</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>AI</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[180px]">Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No applications found. Assign a grant to a company to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const checklistTotal = app.grant._count.checklistItems;
                const docsUploaded = app._count.documents;
                const allowedStatuses = getAllowedNextStatuses(app.status);

                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/pipeline/${app.id}`}
                          className="font-medium leading-snug hover:text-primary hover:underline transition-colors"
                        >
                          {app.grant.name}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {app.grant.jurisdiction}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {app.company.name}
                    </TableCell>
                    <TableCell>{statusBadge(app.status)}</TableCell>
                    <TableCell>
                      {app.grant.deadline ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          {app.grant.deadline}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => setDocsTarget(app)}
                        aria-label={`Manage documents for ${app.grant.name}`}
                      >
                        <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        {docsUploaded} / {checklistTotal}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 gap-1.5 text-xs ${app.eligibilityResult ? "text-primary" : ""}`}
                        onClick={() => setEligibilityTarget(app)}
                        aria-label={`AI eligibility for ${app.grant.name}`}
                      >
                        <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                        {app.eligibilityResult ? "View" : "Assess"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => {
                          setEditNotesTarget(app);
                          setNotesValue(app.notes ?? "");
                        }}
                        aria-label={`Edit notes for ${app.grant.name}`}
                      >
                        <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                        {app.notes ? "Edit" : "Add"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.status}
                        onValueChange={(val) =>
                          handleStatusChange(
                            app.id,
                            val as ApplicationStatus
                          )
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-[160px] text-xs"
                          aria-label={`Change status for ${app.grant.name}`}
                        >
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Grant Dialog */}
      <AssignGrantDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        companies={companies}
        grants={grants}
      />

      {/* Edit Notes Dialog */}
      <Dialog
        open={!!editNotesTarget}
        onOpenChange={(open) => {
          if (!open) setEditNotesTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Application Notes</DialogTitle>
          </DialogHeader>
          {editNotesTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {editNotesTarget.grant.name} &mdash;{" "}
                {editNotesTarget.company.name}
              </p>
              <div className="space-y-2">
                <Label htmlFor="app-notes">Notes</Label>
                <Textarea
                  id="app-notes"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={5}
                  placeholder="Add internal notes about this application..."
                />
              </div>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditNotesTarget(null)}
                  disabled={savingNotes}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog
        open={!!docsTarget}
        onOpenChange={(open) => {
          if (!open) setDocsTarget(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
          </DialogHeader>
          {docsTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {docsTarget.grant.name} &mdash; {docsTarget.company.name}
              </p>
              <DocumentManager
                applicationId={docsTarget.id}
                checklistItems={docsTarget.grant.checklistItems}
                documents={docsTarget.documents}
                isAdmin={true}
                canUpload={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Eligibility Dialog */}
      <Dialog
        open={!!eligibilityTarget}
        onOpenChange={(open) => {
          if (!open) setEligibilityTarget(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Eligibility Assessment</DialogTitle>
          </DialogHeader>
          {eligibilityTarget && (
            <EligibilityPanel
              applicationId={eligibilityTarget.id}
              grantName={eligibilityTarget.grant.name}
              companyName={eligibilityTarget.company.name}
              existingResult={
                eligibilityTarget.eligibilityResult as EligibilityResult | null
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
