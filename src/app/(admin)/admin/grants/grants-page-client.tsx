"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, Star, Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { deleteGrant } from "@/lib/actions/grants";
import { GrantFormDialog } from "./grant-form-dialog";
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

export type GrantWithRelations = {
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

const JURISDICTIONS = [
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

const STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "MONITORING", label: "Monitoring" },
];

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

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────

export function GrantsPageClient({
  grants,
  currentJurisdiction,
  currentStatus,
  currentSearch,
}: {
  grants: GrantWithRelations[];
  currentJurisdiction: string;
  currentStatus: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGrant, setEditGrant] = useState<GrantWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GrantWithRelations | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchValue, setSearchValue] = useState(currentSearch);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/grants?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateFilter("q", value || null);
    }, 400);
  }

  function clearAllFilters() {
    setSearchValue("");
    router.push("/admin/grants");
  }

  const hasFilters =
    currentJurisdiction !== "ALL" ||
    currentStatus !== "ALL" ||
    currentSearch.length > 0;

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteGrant(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);

    if (result.success) {
      toast.success("Grant deleted successfully");
    } else {
      toast.error(result.error ?? "Failed to delete grant");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Grant Registry
          </h2>
          <p className="text-sm text-muted-foreground">
            {grants.length} grant{grants.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Grant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search grants..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search grants by name or description"
          />
        </div>

        <Select
          value={currentJurisdiction}
          onValueChange={(val) => updateFilter("jurisdiction", val)}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by jurisdiction">
            <SelectValue placeholder="Jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            {JURISDICTIONS.map((j) => (
              <SelectItem key={j.value} value={j.value}>
                {j.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentStatus}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Grant</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Administering Body</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No grants found. Adjust your filters or create a new grant.
                </TableCell>
              </TableRow>
            ) : (
              grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`/admin/grants/${grant.id}`}
                        className="font-medium leading-snug hover:text-primary hover:underline transition-colors"
                      >
                        {grant.name}
                      </Link>
                      {grant.externalLink && (
                        <a
                          href={
                            grant.externalLink.startsWith("http")
                              ? grant.externalLink
                              : `https://${grant.externalLink}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{grant.jurisdiction}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {grant.administeringBody}
                  </TableCell>
                  <TableCell className="text-sm">{grant.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(grant.status)}>
                      {grant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={grant.relevanceRating} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {grant.deadline ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/grants/${grant.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditGrant(grant)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(grant)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <GrantFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      {/* Edit Dialog */}
      {editGrant && (
        <GrantFormDialog
          open={!!editGrant}
          onOpenChange={(open) => {
            if (!open) setEditGrant(null);
          }}
          mode="edit"
          grant={editGrant}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone. All associated checklist
              items and process steps will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
