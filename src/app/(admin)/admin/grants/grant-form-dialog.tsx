"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import {
  createGrant,
  updateGrant,
  type GrantFormData,
  type ChecklistItemInput,
  type ProcessStepInput,
} from "@/lib/actions/grants";
import type { GrantWithRelations } from "./grants-page-client";
import type { Jurisdiction, GrantStatus } from "@/generated/prisma/browser";

const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
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

const STATUSES: { value: GrantStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "MONITORING", label: "Monitoring" },
];

type Props =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "create";
      grant?: undefined;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "edit";
      grant: GrantWithRelations;
    };

export function GrantFormDialog({ open, onOpenChange, mode, grant }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(grant?.name ?? "");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>(
    grant?.jurisdiction ?? "FEDERAL"
  );
  const [administeringBody, setAdministeringBody] = useState(
    grant?.administeringBody ?? ""
  );
  const [amount, setAmount] = useState(grant?.amount ?? "");
  const [status, setStatus] = useState<GrantStatus>(grant?.status ?? "OPEN");
  const [deadline, setDeadline] = useState(grant?.deadline ?? "");
  const [externalLink, setExternalLink] = useState(grant?.externalLink ?? "");
  const [relevanceRating, setRelevanceRating] = useState(
    grant?.relevanceRating ?? 3
  );
  const [description, setDescription] = useState(grant?.description ?? "");
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    grant?.eligibilityCriteria ?? ""
  );

  // Dynamic lists
  const [checklistItems, setChecklistItems] = useState<ChecklistItemInput[]>(
    grant?.checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      sortOrder: item.sortOrder,
    })) ?? []
  );
  const [processSteps, setProcessSteps] = useState<ProcessStepInput[]>(
    grant?.processSteps.map((step) => ({
      id: step.id,
      label: step.label,
      sortOrder: step.sortOrder,
    })) ?? []
  );

  function addChecklistItem() {
    setChecklistItems([
      ...checklistItems,
      { label: "", sortOrder: checklistItems.length + 1 },
    ]);
  }

  function removeChecklistItem(index: number) {
    const updated = checklistItems.filter((_, i) => i !== index);
    setChecklistItems(
      updated.map((item, i) => ({ ...item, sortOrder: i + 1 }))
    );
  }

  function updateChecklistItem(index: number, label: string) {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], label };
    setChecklistItems(updated);
  }

  function addProcessStep() {
    setProcessSteps([
      ...processSteps,
      { label: "", sortOrder: processSteps.length + 1 },
    ]);
  }

  function removeProcessStep(index: number) {
    const updated = processSteps.filter((_, i) => i !== index);
    setProcessSteps(
      updated.map((step, i) => ({ ...step, sortOrder: i + 1 }))
    );
  }

  function updateProcessStep(index: number, label: string) {
    const updated = [...processSteps];
    updated[index] = { ...updated[index], label };
    setProcessSteps(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const data: GrantFormData = {
      name,
      jurisdiction,
      administeringBody,
      amount,
      status,
      deadline,
      externalLink,
      relevanceRating,
      description,
      eligibilityCriteria,
      checklistItems: checklistItems.filter((item) => item.label.trim()),
      processSteps: processSteps.filter((step) => step.label.trim()),
    };

    const result =
      mode === "create"
        ? await createGrant(data)
        : await updateGrant(grant.id, data);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        mode === "create" ? "Grant created successfully" : "Grant updated successfully"
      );
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Grant" : `Edit: ${grant.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1">
                Checklist ({checklistItems.length})
              </TabsTrigger>
              <TabsTrigger value="steps" className="flex-1">
                Process Steps ({processSteps.length})
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Grant Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. IBA Business Loan Package"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Select
                    value={jurisdiction}
                    onValueChange={(val) =>
                      setJurisdiction(val as Jurisdiction)
                    }
                  >
                    <SelectTrigger id="jurisdiction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.map((j) => (
                        <SelectItem key={j.value} value={j.value}>
                          {j.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as GrantStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="administeringBody">Administering Body *</Label>
                <Input
                  id="administeringBody"
                  value={administeringBody}
                  onChange={(e) => setAdministeringBody(e.target.value)}
                  required
                  placeholder="e.g. Indigenous Business Australia (IBA)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="e.g. Up to $5,000,000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="e.g. Ongoing or 30/04/2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="externalLink">External Link</Label>
                  <Input
                    id="externalLink"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="e.g. iba.gov.au/business/finance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relevanceRating">
                    Relevance Rating (1-5)
                  </Label>
                  <Select
                    value={String(relevanceRating)}
                    onValueChange={(val) => setRelevanceRating(Number(val))}
                  >
                    <SelectTrigger id="relevanceRating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {"★".repeat(r)}{"☆".repeat(5 - r)} ({r})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the grant programme, its purpose, and key details..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eligibilityCriteria">
                  Eligibility Criteria
                </Label>
                <Textarea
                  id="eligibilityCriteria"
                  value={eligibilityCriteria}
                  onChange={(e) => setEligibilityCriteria(e.target.value)}
                  rows={3}
                  placeholder="List the eligibility requirements for this grant..."
                />
              </div>
            </TabsContent>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Define the documents required for this grant application.
              </p>

              {checklistItems.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No checklist items yet. Add documents that applicants need to
                  provide.
                </div>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateChecklistItem(index, e.target.value)
                        }
                        placeholder="e.g. Business Plan"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChecklistItem(index)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Checklist Item
              </Button>
            </TabsContent>

            {/* Process Steps Tab */}
            <TabsContent value="steps" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Define the step-by-step process for applying to this grant.
              </p>

              {processSteps.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No process steps yet. Add the steps an applicant should
                  follow.
                </div>
              ) : (
                <div className="space-y-2">
                  {processSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <Input
                        value={step.label}
                        onChange={(e) =>
                          updateProcessStep(index, e.target.value)
                        }
                        placeholder="e.g. Register with IBA portal"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProcessStep(index)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProcessStep}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Process Step
              </Button>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Create Grant" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
