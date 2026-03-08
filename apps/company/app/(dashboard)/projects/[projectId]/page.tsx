import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { FileText, Users, Clock, Plus, Settings } from "lucide-react";

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerClient();

  // Get project
  const { data: projectData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", projectId)
    .single();

  const project = projectData as {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  } | null;

  if (!project) {
    notFound();
  }

  // Get hearing requests count for this project
  const { count: hearingCount } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  // Get active hearings count
  const { count: activeCount } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "active");

  // Get recent sessions for this project
  const { data: recentSessionsData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      id,
      status,
      created_at,
      hearing_request:hearing_requests!inner(
        id,
        title,
        project_id
      )
    `)
    .eq("hearing_request.project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSessions = recentSessionsData as Array<{
    id: string;
    status: string;
    created_at: string;
    hearing_request: { id: string; title: string; project_id: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || "Project dashboard"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/hearings/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Hearing
            </Button>
          </Link>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>
              Latest hearing sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {session.hearing_request && typeof session.hearing_request === 'object' && 'title' in session.hearing_request
                          ? session.hearing_request.title
                          : "Unknown Hearing"}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                      <Link href={`/projects/${projectId}/results/${session.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No sessions yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/projects/${projectId}/hearings`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View All Hearings
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/results`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/hearings/new`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Hearing
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/settings`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                SDK Integration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
