import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { FileText, Users, Clock, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get company for the current user
  // Using type assertion to bypass RLS-induced type restrictions
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company_id: string } | null;
  const companyId = companyMember?.company_id;

  // Get hearing requests count
  const { count: hearingCount } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId ?? "");

  // Get active hearings count
  const { count: activeCount } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId ?? "")
    .eq("status", "active");

  // Get recent sessions
  const { data: recentSessionsData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      id,
      status,
      created_at,
      hearing_request:hearing_requests!inner(
        id,
        title,
        company_id
      )
    `)
    .eq("hearing_request.company_id", companyId ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSessions = recentSessionsData as Array<{
    id: string;
    status: string;
    created_at: string;
    hearing_request: { id: string; title: string; company_id: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Hearing overview and recent activity
          </p>
        </div>
        <Link href="/hearings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Hearing
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Hearings
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hearingCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Hearings
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSessions?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Latest hearing session list
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {session.hearing_request && typeof session.hearing_request === 'object' && 'title' in session.hearing_request
                        ? session.hearing_request.title
                        : "Unknown Hearing"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "recording"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {session.status === "completed"
                        ? "Completed"
                        : session.status === "recording"
                          ? "Recording"
                          : session.status === "interview"
                            ? "Interview"
                            : session.status === "pending"
                              ? "Pending"
                              : "Cancelled"}
                    </span>
                    <Link href={`/results/${session.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No sessions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
