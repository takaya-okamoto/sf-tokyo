import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { ArrowLeft } from "lucide-react";

export default async function HearingResultsPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>;
}) {
  const { projectId, id } = await params;
  const supabase = await createServerClient();

  const { data: hearingData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  const hearing = hearingData as {
    id: string;
    title: string;
    description: string | null;
    target_url: string;
    status: string;
  } | null;

  if (!hearing) {
    notFound();
  }

  const { data: sessionsData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      profile:profiles(display_name, email)
    `)
    .eq("hearing_request_id", id)
    .order("created_at", { ascending: false });

  const sessions = sessionsData as Array<{
    id: string;
    status: string;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    profile: { display_name: string | null; email: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/hearings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{hearing.title}</h1>
          <p className="text-muted-foreground">
            Session Results
          </p>
        </div>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {session.profile && typeof session.profile === 'object' && 'display_name' in session.profile
                        ? session.profile.display_name || session.profile.email
                        : "Anonymous User"}
                    </CardTitle>
                    <CardDescription>
                      {new Date(session.created_at).toLocaleString("en-US")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "recording"
                            ? "bg-blue-100 text-blue-700"
                            : session.status === "interview"
                              ? "bg-purple-100 text-purple-700"
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
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Time</p>
                    <p>
                      {session.started_at
                        ? new Date(session.started_at).toLocaleString("en-US")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Time</p>
                    <p>
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleString("en-US")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p>
                      {session.started_at && session.completed_at
                        ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60)} min`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No sessions yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
