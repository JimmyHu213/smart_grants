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
import { DashboardApplicationCard } from "./dashboard-application-card";

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
          checklistItems: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true, sortOrder: true },
          },
          _count: { select: { checklistItems: true } },
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: { fullName: true, email: true },
          },
          checklistItem: {
            select: { label: true },
          },
        },
        orderBy: { createdAt: "desc" },
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

  // Serialise for client components
  const serialisedApplications = applications.map((app) => ({
    id: app.id,
    status: app.status,
    grant: {
      name: app.grant.name,
      jurisdiction: app.grant.jurisdiction,
      deadline: app.grant.deadline,
      amount: app.grant.amount,
      checklistItems: app.grant.checklistItems,
      checklistCount: app.grant._count.checklistItems,
    },
    nextStep: getNextStep(app.status, app.grant.processSteps),
    docsUploaded: app._count.documents,
    documents: app.documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
    })),
  }));

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
            {serialisedApplications.map((app) => {
              const statusConfig = STATUS_CONFIG[app.status] ?? {
                label: app.status,
                variant: "outline" as const,
              };

              return (
                <DashboardApplicationCard
                  key={app.id}
                  app={app}
                  statusConfig={statusConfig}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
