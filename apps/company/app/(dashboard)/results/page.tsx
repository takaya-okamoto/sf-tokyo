import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@repo/ui";

export default async function ResultsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company_id: string } | null;

  const { data: sessionsData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      hearing_request:hearing_requests!inner(
        id,
        title,
        company_id
      ),
      profile:profiles(display_name, email)
    `)
    .eq("hearing_request.company_id", companyMember?.company_id ?? "")
    .order("created_at", { ascending: false });

  const sessions = sessionsData as Array<{
    id: string;
    status: string;
    created_at: string;
    hearing_request: { id: string; title: string; company_id: string } | null;
    profile: { display_name: string | null; email: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          View and analyze all session results
        </p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {session.hearing_request && typeof session.hearing_request === 'object' && 'title' in session.hearing_request
                        ? session.hearing_request.title
                        : "Unknown Hearing"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Participant: {session.profile && typeof session.profile === 'object' && 'display_name' in session.profile
                        ? session.profile.display_name || session.profile.email
                        : "Anonymous User"}
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
                      <Button size="sm">Details</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.created_at).toLocaleString("en-US")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No session results yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
