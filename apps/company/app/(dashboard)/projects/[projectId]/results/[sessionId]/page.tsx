import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import { ArrowLeft, Video, MessageSquare, FileText, MousePointer } from "lucide-react";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}) {
  const { projectId, sessionId } = await params;
  const supabase = await createServerClient();

  const { data: sessionData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      hearing_request:hearing_requests(*),
      profile:profiles(display_name, email)
    `)
    .eq("id", sessionId)
    .single();

  const session = sessionData as {
    id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    hearing_request: { title: string; project_id: string } | null;
    profile: { display_name: string | null; email: string } | null;
  } | null;

  if (!session) {
    notFound();
  }

  // Verify this session belongs to the project
  if (session.hearing_request?.project_id !== projectId) {
    notFound();
  }

  const { data: recordingsData } = await (supabase
    .from("recordings") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("session_id", sessionId);

  const recordings = recordingsData as Array<{
    id: string;
    recording_type: string;
    duration: number | null;
    storage_path: string;
  }> | null;

  const { data: eventLogsData } = await (supabase
    .from("event_logs") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });

  const eventLogs = eventLogsData as Array<{
    id: string;
    event_type: string;
    timestamp: string;
    data: unknown;
  }> | null;

  const { data: messagesData } = await (supabase
    .from("ai_interview_messages") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const messages = messagesData as Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }> | null;

  const { data: summaryData } = await (supabase
    .from("ai_interview_summaries") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("session_id", sessionId)
    .single();

  const summary = summaryData as {
    summary: string;
    key_insights: unknown[] | null;
  } | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/results`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Session Details</h1>
          <p className="text-muted-foreground">
            {session.hearing_request && typeof session.hearing_request === 'object' && 'title' in session.hearing_request
              ? session.hearing_request.title
              : "Unknown Hearing"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {session.profile && typeof session.profile === 'object' && 'display_name' in session.profile
                ? session.profile.display_name || session.profile.email
                : "Anonymous User"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Start Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {session.started_at
                ? new Date(session.started_at).toLocaleString("en-US")
                : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {session.started_at && session.completed_at
                ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60)} min`
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AI Summary
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Recordings ({recordings?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Event Logs ({eventLogs?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat ({messages?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>
                AI analysis of the interview content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p>{summary.summary}</p>
                  </div>
                  {summary.key_insights && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Insights</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {Array.isArray(summary.key_insights) && summary.key_insights.map((insight, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {String(insight)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  AI summary not yet generated
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <CardTitle>Recording Data</CardTitle>
              <CardDescription>
                Recordings from the session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings && recordings.length > 0 ? (
                <div className="space-y-4">
                  {recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Video className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{recording.recording_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {recording.duration
                              ? `${Math.round(recording.duration / 60)} min`
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Play
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No recording data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Logs</CardTitle>
              <CardDescription>
                User interaction logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventLogs && eventLogs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {eventLogs.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-2 text-sm border-b last:border-0"
                    >
                      <span className="text-muted-foreground w-24 shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString("en-US")}
                      </span>
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {event.event_type}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {event.data ? JSON.stringify(event.data) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No event logs
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat History</CardTitle>
              <CardDescription>
                Interview chat logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages && messages.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "assistant" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "assistant"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString("en-US")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No chat history
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
