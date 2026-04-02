"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileCheck,
  Clock,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { DocumentManager } from "@/components/document-manager";

// ─── Types ─────────────────────────────────────────────

type ChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
};

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

type SerializedApp = {
  id: string;
  status: string;
  grant: {
    name: string;
    jurisdiction: string;
    deadline: string | null;
    amount: string;
    checklistItems: ChecklistItem[];
    checklistCount: number;
  };
  nextStep: string | null;
  docsUploaded: number;
  documents: DocumentRecord[];
};

type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

// ─── Component ────────────────────────────────────────

export function DashboardApplicationCard({
  app,
  statusConfig,
}: {
  app: SerializedApp;
  statusConfig: StatusConfig;
}) {
  const [docsOpen, setDocsOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Grant info */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold leading-snug">
                    {app.grant.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {app.grant.jurisdiction}
                    </Badge>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Amount */}
              {app.grant.amount && (
                <p className="text-sm text-muted-foreground">
                  Amount: {app.grant.amount}
                </p>
              )}

              {/* Next step */}
              {app.nextStep && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Next: <span className="text-foreground">{app.nextStep}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Right: Deadline + Docs */}
            <div className="flex shrink-0 flex-col gap-2 text-sm sm:items-end">
              {/* Deadline */}
              {app.grant.deadline && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{app.grant.deadline}</span>
                </div>
              )}

              {/* Document checklist progress */}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-2 py-1 text-sm"
                onClick={() => setDocsOpen(true)}
                aria-label={`Manage documents for ${app.grant.name}`}
              >
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">
                  {app.docsUploaded} / {app.grant.checklistCount} documents
                </span>
              </Button>

              {/* Progress bar */}
              {app.grant.checklistCount > 0 && (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (app.docsUploaded / app.grant.checklistCount) * 100
                      )}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={app.docsUploaded}
                    aria-valuemin={0}
                    aria-valuemax={app.grant.checklistCount}
                    aria-label={`${app.docsUploaded} of ${app.grant.checklistCount} documents uploaded`}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Dialog */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {app.grant.name}
            </p>
            <DocumentManager
              applicationId={app.id}
              checklistItems={app.grant.checklistItems}
              documents={app.documents}
              isAdmin={false}
              canUpload={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
