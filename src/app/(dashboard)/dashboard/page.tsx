import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  Clock,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Status Display ───────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
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

// ─── Page ─────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back{user?.fullName ? `, ${user.fullName}` : ""}.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Company Linked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is not yet linked to a company. Please contact your
              administrator to set up your company profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch company and its applications — scoped to this user's company only
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });

  const applications = await prisma.grantApplication.findMany({
    where: { companyId: user.companyId },
    include: {
      grant: {
        select: {
          id: true,
          name: true,
          jurisdiction: true,
          deadline: true,
          amount: true,
          status: true,
          processSteps: {
            orderBy: { sortOrder: "asc" },
            select: { label: true, sortOrder: true },
          },
          _count: { select: { checklistItems: true } },
        },
      },
      _count: {
        select: { documents: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  // Summary stats
  const activeApps = applications.filter(
    (a) => a.status !== "CLOSED" && a.status !== "APPROVED" && a.status !== "REJECTED"
  );
  const approvedApps = applications.filter((a) => a.status === "APPROVED");
  const totalApps = applications.length;

  // Determine next process step for each application based on status
  function getNextStep(
    status: string,
    processSteps: { label: string; sortOrder: number }[]
  ): string | null {
    if (processSteps.length === 0) return null;

    // Map status to approximate step index
    const statusStepMap: Record<string, number> = {
      NOT_STARTED: 0,
      RESEARCHING: 1,
      DRAFTING: 2,
      SUBMITTED: 3,
      UNDER_REVIEW: 4,
      APPROVED: processSteps.length,
      REJECTED: processSteps.length,
      CLOSED: processSteps.length,
    };

    const stepIndex = statusStepMap[status] ?? 0;
    if (stepIndex < processSteps.length) {
      return processSteps[stepIndex].label;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back{user.fullName ? `, ${user.fullName}` : ""}
          {company ? ` — ${company.name}` : ""}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Applications
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApps.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Grant Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your grant applications will appear here once your administrator
              assigns grants to your company&apos;s pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Grant Applications</h3>
          <div className="grid gap-4">
            {applications.map((app) => {
              const statusConfig = STATUS_CONFIG[app.status] ?? {
                label: app.status,
                variant: "outline" as const,
              };
              const checklistTotal = app.grant._count.checklistItems;
              const docsUploaded = app._count.documents;
              const nextStep = getNextStep(
                app.status,
                app.grant.processSteps
              );

              return (
                <Card key={app.id}>
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
                        {nextStep && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>
                              Next: <span className="text-foreground">{nextStep}</span>
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
                        <div className="flex items-center gap-1.5">
                          <FileCheck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          <span className="text-muted-foreground">
                            {docsUploaded} / {checklistTotal} documents
                          </span>
                        </div>

                        {/* Progress bar */}
                        {checklistTotal > 0 && (
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (docsUploaded / checklistTotal) * 100
                                )}%`,
                              }}
                              role="progressbar"
                              aria-valuenow={docsUploaded}
                              aria-valuemin={0}
                              aria-valuemax={checklistTotal}
                              aria-label={`${docsUploaded} of ${checklistTotal} documents uploaded`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
