import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { CheckCircle, Clock, Play } from "lucide-react";

interface SessionWithHearing {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  hearing_request: {
    title: string;
    reward_amount: number | null;
    reward_type: string | null;
    company: { name: string } | null;
  } | null;
}

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("interview_sessions")
    .select(`
      *,
      hearing_request:hearing_requests(
        title,
        reward_amount,
        reward_type,
        company:companies(name)
      )
    `)
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const sessions = data as SessionWithHearing[] | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Participation History</h1>
        <p className="text-muted-foreground">
          List of hearings you have participated in
        </p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => {
            const hearing = session.hearing_request;

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {hearing?.company?.name ?? "Company"}
                      </p>
                      <CardTitle className="text-lg">
                        {hearing?.title ?? "Unknown Hearing"}
                      </CardTitle>
                      <CardDescription>
                        {new Date(session.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === "completed" ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </span>
                      ) : session.status === "recording" || session.status === "interview" ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          <Play className="h-3 w-3" />
                          In Progress
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {session.started_at && session.completed_at ? (
                      <span>
                        Duration: {Math.round(
                          (new Date(session.completed_at).getTime() -
                            new Date(session.started_at).getTime()) /
                            1000 /
                            60
                        )} min
                      </span>
                    ) : session.started_at ? (
                      <span>Started: {new Date(session.started_at).toLocaleTimeString("en-US")}</span>
                    ) : (
                      <span>Not started</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {hearing?.reward_amount && session.status === "completed" && (
                      <span className="text-green-600 font-medium">
                        {hearing.reward_type === "cash"
                          ? `$${hearing.reward_amount.toLocaleString()}`
                          : `${hearing.reward_amount} points`}
                        {" "}earned
                      </span>
                    )}
                    {session.status !== "completed" && session.status !== "cancelled" && (
                      <Link href={
                        session.status === "pending"
                          ? `/session/${session.id}`
                          : session.status === "recording"
                            ? `/session/${session.id}/recording`
                            : `/interview/${session.id}`
                      }>
                        <Button size="sm">Continue</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground mb-4">
              You haven&apos;t participated in any hearings yet
            </p>
            <div className="flex justify-center">
              <Link href="/">
                <Button>Find Hearings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
