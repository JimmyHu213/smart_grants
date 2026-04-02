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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  createCompany,
  updateCompany,
  type CompanyFormData,
} from "@/lib/actions/companies";

export type CompanyWithUsers = {
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
  createdAt: string;
  updatedAt: string;
  profiles: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
  }[];
  _count: { applications: number };
};

type Props =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "create";
      company?: undefined;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "edit";
      company: CompanyWithUsers;
    };

export function CompanyFormDialog({
  open,
  onOpenChange,
  mode,
  company,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(company?.name ?? "");
  const [abn, setAbn] = useState(company?.abn ?? "");
  const [jurisdiction, setJurisdiction] = useState(
    company?.jurisdiction ?? ""
  );
  const [industry, setIndustry] = useState(company?.industry ?? "");
  const [indigenousOwnership, setIndigenousOwnership] = useState(
    company?.indigenousOwnership ?? false
  );
  const [turnover, setTurnover] = useState(company?.turnover ?? "");
  const [tradingDuration, setTradingDuration] = useState(
    company?.tradingDuration ?? ""
  );
  const [employeeCount, setEmployeeCount] = useState(
    company?.employeeCount?.toString() ?? ""
  );
  const [description, setDescription] = useState(company?.description ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const data: CompanyFormData = {
      name,
      abn: abn || undefined,
      jurisdiction: jurisdiction || undefined,
      industry: industry || undefined,
      indigenousOwnership,
      turnover: turnover || undefined,
      tradingDuration: tradingDuration || undefined,
      employeeCount: employeeCount ? parseInt(employeeCount, 10) : null,
      description: description || undefined,
    };

    const result =
      mode === "create"
        ? await createCompany(data)
        : await updateCompany(company.id, data);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        mode === "create"
          ? "Company created successfully"
          : "Company updated successfully"
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
            {mode === "create"
              ? "Create New Company"
              : `Edit: ${company.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Arafura Voyages Pty Ltd"
            />
          </div>

          {/* ABN + Jurisdiction row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-abn">ABN</Label>
              <Input
                id="company-abn"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="e.g. 12 345 678 901"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-jurisdiction">
                Jurisdiction / State
              </Label>
              <Input
                id="company-jurisdiction"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. NT, QLD, Federal"
              />
            </div>
          </div>

          {/* Industry + Employee Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-industry">Industry</Label>
              <Input
                id="company-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Tourism, Hospitality"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-employees">Employee Count</Label>
              <Input
                id="company-employees"
                type="number"
                min="0"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          {/* Turnover + Trading Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-turnover">Annual Turnover</Label>
              <Input
                id="company-turnover"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                placeholder="e.g. $500,000 - $1M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-trading">Trading Duration</Label>
              <Input
                id="company-trading"
                value={tradingDuration}
                onChange={(e) => setTradingDuration(e.target.value)}
                placeholder="e.g. 3 years"
              />
            </div>
          </div>

          {/* Indigenous Ownership */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="company-indigenous"
              checked={indigenousOwnership}
              onCheckedChange={(checked) =>
                setIndigenousOwnership(checked === true)
              }
            />
            <Label
              htmlFor="company-indigenous"
              className="text-sm font-normal cursor-pointer"
            >
              Indigenous-owned organisation (for eligibility matching)
            </Label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="company-description">
              Description / Notes
            </Label>
            <Textarea
              id="company-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the company, its operations, and goals..."
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
              {mode === "create" ? "Create Company" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
