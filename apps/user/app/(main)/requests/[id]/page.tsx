import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@repo/ui";
import { ArrowLeft, ExternalLink, Clock, Gift, CheckCircle } from "lucide-react";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: hearingData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      company:companies(name, description, logo_url, website)
    `)
    .eq("id", id)
    .single();

  const hearing = hearingData as {
    id: string;
    title: string;
    description: string | null;
    target_url: string;
    instructions: string | null;
    reward_amount: number | null;
    reward_type: string | null;
    company: { name: string; description: string | null; logo_url: string | null; website: string | null } | null;
  } | null;

  if (!hearing) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Check if user already has a session for this hearing
  const { data: existingSessionData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select("id, status")
    .eq("hearing_request_id", id)
    .eq("user_id", user?.id ?? "")
    .single();

  const existingSession = existingSessionData as { id: string; status: string } | null;

  async function startSession() {
    "use server";
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // Using type assertion to bypass RLS-induced type restrictions
    const { data: sessionData, error } = await (supabase
      .from("interview_sessions") as ReturnType<typeof supabase.from>)
      .insert({
        hearing_request_id: id,
        user_id: user.id,
        status: "pending",
      } as never)
      .select()
      .single();

    const session = sessionData as { id: string } | null;

    if (error || !session) {
      return;
    }

    redirect(`/session/${session.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">
            {hearing.company && typeof hearing.company === 'object' && 'name' in hearing.company
              ? hearing.company.name
              : "Company"}
          </p>
          <h1 className="text-2xl font-bold">{hearing.title}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hearing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">
              {hearing.description || "No description"}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Target Service</h3>
            <a
              href={hearing.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {hearing.target_url}
            </a>
          </div>

          {hearing.instructions && (
            <div>
              <h3 className="font-medium mb-2">Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {hearing.instructions}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">About 15-30 min</p>
              </div>
            </div>
            {hearing.reward_amount && (
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Reward</p>
                  <p className="font-medium text-green-600">
                    {hearing.reward_type === "cash"
                      ? `$${hearing.reward_amount.toLocaleString()}`
                      : `${hearing.reward_amount} points`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {existingSession ? (
            existingSession.status === "completed" ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>This hearing has been completed</span>
              </div>
            ) : (
              <Link href={`/session/${existingSession.id}`} className="w-full">
                <Button className="w-full">Continue Session</Button>
              </Link>
            )
          ) : (
            <form action={startSession} className="w-full">
              <Button type="submit" className="w-full">
                Participate
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center">
            By participating, you agree to the Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
