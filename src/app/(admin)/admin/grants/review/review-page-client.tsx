"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Loader2, ExternalLink } from "lucide-react";
import { reviewGrant, bulkReviewGrants } from "@/lib/actions/review";

type PendingGrant = {
  id: string;
  name: string;
  jurisdiction: string;
  administeringBody: string;
  amount: string;
  status: string;
  deadline: string | null;
  externalLink: string | null;
  sourceUrl: string | null;
  description: string;
  eligibilityCriteria: string | null;
  crawledAt: string | null;
  checklistItems: { id: string; label: string; sortOrder: number }[];
  processSteps: { id: string; label: string; sortOrder: number }[];
};

export function ReviewPageClient({ grants }: { grants: PendingGrant[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [detailGrant, setDetailGrant] = useState<PendingGrant | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === grants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(grants.map((g) => g.id)));
    }
  }

  async function handleReview(grantId: string, action: "approve" | "reject") {
    setLoadingId(grantId);
    const result = await reviewGrant(grantId, action);
    if (result.success) {
      toast.success(`Grant ${action === "approve" ? "approved" : "rejected"}`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Action failed");
    }
    setLoadingId(null);
  }

  async function handleBulk(action: "approve" | "reject") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const result = await bulkReviewGrants(Array.from(selected), action);
    if (result.success) {
      toast.success(
        `${selected.size} grant${selected.size > 1 ? "s" : ""} ${action === "approve" ? "approved" : "rejected"}`
      );
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(result.error ?? "Bulk action failed");
    }
    setBulkLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Review Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {grants.length} grant{grants.length !== 1 ? "s" : ""} pending review
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              size="sm"
              onClick={() => handleBulk("approve")}
              disabled={bulkLoading}
            >
              {bulkLoading && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulk("reject")}
              disabled={bulkLoading}
            >
              Reject All
            </Button>
          </div>
        )}
      </div>

      {grants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No grants pending review. Use the Crawl page to discover new grants.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size === grants.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Grant</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Crawled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(grant.id)}
                      onCheckedChange={() => toggleSelect(grant.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{grant.name}</p>
                        {grant.externalLink && (
                          <a
                            href={grant.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                            aria-label="Open grant website"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {grant.administeringBody}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{grant.jurisdiction}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{grant.amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {grant.crawledAt
                      ? new Date(grant.crawledAt).toLocaleDateString("en-AU")
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDetailGrant(grant)}
                        aria-label="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleReview(grant.id, "approve")}
                        disabled={loadingId === grant.id}
                        aria-label="Approve"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleReview(grant.id, "reject")}
                        disabled={loadingId === grant.id}
                        aria-label="Reject"
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Grant detail dialog */}
      <Dialog open={!!detailGrant} onOpenChange={() => setDetailGrant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailGrant?.name}</DialogTitle>
          </DialogHeader>
          {detailGrant && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">
                  Administering Body
                </p>
                <p>{detailGrant.administeringBody}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground">Amount</p>
                  <p>{detailGrant.amount}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Deadline</p>
                  <p>{detailGrant.deadline || "Not specified"}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap">
                  {detailGrant.description}
                </p>
              </div>
              {detailGrant.eligibilityCriteria && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Eligibility
                  </p>
                  <p className="whitespace-pre-wrap">
                    {detailGrant.eligibilityCriteria}
                  </p>
                </div>
              )}
              {detailGrant.checklistItems.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Checklist Items
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    {detailGrant.checklistItems.map((item) => (
                      <li key={item.id}>{item.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {detailGrant.processSteps.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Process Steps
                  </p>
                  <ol className="mt-1 list-decimal pl-5">
                    {detailGrant.processSteps.map((step) => (
                      <li key={step.id}>{step.label}</li>
                    ))}
                  </ol>
                </div>
              )}
              {detailGrant.sourceUrl && (
                <div>
                  <p className="font-medium text-muted-foreground">Source</p>
                  <a
                    href={detailGrant.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {detailGrant.sourceUrl}
                  </a>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReview(detailGrant.id, "reject");
                    setDetailGrant(null);
                  }}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    handleReview(detailGrant.id, "approve");
                    setDetailGrant(null);
                  }}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
