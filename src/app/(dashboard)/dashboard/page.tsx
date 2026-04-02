import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

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
          <CardTitle>Your Grant Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your grant applications will appear here once your administrator
            assigns grants to your company&apos;s pipeline.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
