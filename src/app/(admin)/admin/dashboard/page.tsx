import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Building2,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

// ─── Status Display ───────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    colour: string;
  }
> = {
  NOT_STARTED: { label: "Not Started", variant: "outline", colour: "text-muted-foreground" },
  RESEARCHING: { label: "Researching", variant: "secondary", colour: "text-blue-400" },
  DRAFTING: { label: "Drafting", variant: "secondary", colour: "text-amber-400" },
  SUBMITTED: { label: "Submitted", variant: "default", colour: "text-emerald-400" },
  UNDER_REVIEW: { label: "Under Review", variant: "default", colour: "text-purple-400" },
  APPROVED: { label: "Approved", variant: "default", colour: "text-green-400" },
  REJECTED: { label: "Rejected", variant: "destructive", colour: "text-red-400" },
  CLOSED: { label: "Closed", variant: "outline", colour: "text-muted-foreground" },
};

export default async function AdminDashboardPage() {
  // Fetch all stats in parallel
  const [
    totalGrants,
    openGrants,
    totalCompanies,
    totalApplications,
    applicationsByStatus,
    upcomingDeadlineApps,
    recentApplications,
  ] = await Promise.all([
    prisma.grant.count(),
    prisma.grant.count({ where: { status: "OPEN" } }),
    prisma.company.count(),
    prisma.grantApplication.count(),
    prisma.grantApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Grants with upcoming deadlines: fetch grants that have a deadline field
    // containing a date-like string. Since deadlines are free-text, we fetch
    // all open/monitoring grants with applications and show them sorted.
    prisma.grantApplication.findMany({
      where: {
        status: {
          notIn: ["CLOSED", "APPROVED", "REJECTED"],
        },
        grant: {
          status: { not: "CLOSED" },
          deadline: { not: null },
        },
      },
      include: {
        grant: {
          select: {
            name: true,
            jurisdiction: true,
            deadline: true,
          },
        },
        company: {
          select: { name: true },
        },
      },
      orderBy: { grant: { deadline: "asc" } },
      take: 10,
    }),
    // Recent applications (last 10 updated)
    prisma.grantApplication.findMany({
      include: {
        grant: {
          select: { name: true, jurisdiction: true },
        },
        company: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  // Build status counts map
  const statusCounts: Record<string, number> = {};
  for (const group of applicationsByStatus) {
    statusCounts[group.status] = group._count.id;
  }

  const activeApplications = totalApplications - (statusCounts["CLOSED"] ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of grants, companies, and applications.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/grants">
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Grants</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalGrants}</div>
              <p className="text-xs text-muted-foreground">
                {openGrants} open
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/companies">
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                client organisations
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/pipeline">
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {activeApplications} active
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/pipeline?status=SUBMITTED">
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(statusCounts["SUBMITTED"] ?? 0) +
                  (statusCounts["UNDER_REVIEW"] ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                submitted or under review
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Applications by Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Applications by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = statusCounts[status] ?? 0;
              return (
                <Link
                  key={status}
                  href={`/admin/pipeline?status=${status}`}
                  className="group"
                >
                  <div className="rounded-lg border border-border p-3 text-center transition-colors hover:border-primary/50">
                    <div className={`text-2xl font-bold ${config.colour}`}>
                      {count}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground group-hover:text-foreground">
                      {config.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two Column: Deadlines + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlineApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active applications with deadlines.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlineApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/pipeline?company=${app.companyId}`}
                    className="group block"
                  >
                    <div className="flex items-start justify-between gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug group-hover:text-primary">
                          {app.grant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.company.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{app.grant.deadline}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => {
                  const config = STATUS_CONFIG[app.status] ?? {
                    label: app.status,
                    variant: "outline" as const,
                  };
                  return (
                    <Link
                      key={app.id}
                      href={`/admin/pipeline?company=${app.companyId}`}
                      className="group block"
                    >
                      <div className="flex items-center justify-between gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug group-hover:text-primary">
                            {app.grant.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{app.company.name}</span>
                            <span>&middot;</span>
                            <Badge
                              variant={config.variant}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {formatRelativeDate(app.updatedAt)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Format a date relative to now (e.g. "2h ago", "3d ago") */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}
