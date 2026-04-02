"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { createApplication } from "@/lib/actions/applications";

type CompanyOption = {
  id: string;
  name: string;
};

type GrantOption = {
  id: string;
  name: string;
  jurisdiction: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyOption[];
  grants: GrantOption[];
};

export function AssignGrantDialog({
  open,
  onOpenChange,
  companies,
  grants,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyId || !grantId) {
      toast.error("Please select both a company and a grant");
      return;
    }

    setIsSubmitting(true);

    const result = await createApplication({
      companyId,
      grantId,
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Grant assigned to company pipeline");
      setCompanyId("");
      setGrantId("");
      setNotes("");
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "Failed to assign grant");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Grant to Pipeline</DialogTitle>
          <DialogDescription>
            Add a grant to a company&apos;s application pipeline. The
            application will start with &ldquo;Not Started&rdquo; status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-company">Company *</Label>
            <Select value={companyId} onValueChange={(val) => setCompanyId(val ?? "")}>
              <SelectTrigger id="assign-company">
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-grant">Grant *</Label>
            <Select value={grantId} onValueChange={(val) => setGrantId(val ?? "")}>
              <SelectTrigger id="assign-grant">
                <SelectValue placeholder="Select a grant..." />
              </SelectTrigger>
              <SelectContent>
                {grants.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <span>{g.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({g.jurisdiction})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-notes">Notes</Label>
            <Textarea
              id="assign-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes about this application..."
            />
          </div>

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
              Assign Grant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
