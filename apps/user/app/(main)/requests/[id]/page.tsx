import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@repo/ui";
import { ArrowLeft, ExternalLink, Clock, Gift, CheckCircle2, ListTodo } from "lucide-react";

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
    estimated_duration: number | null;
    reward_per_user: number | null;
    company: { name: string; description: string | null; logo_url: string | null; website: string | null } | null;
  } | null;

  if (!hearing) {
    notFound();
  }

  // Fetch interview preparations
  const { data: preparationsData } = await (supabase
    .from("interview_preparations") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("hearing_request_id", id)
    .order("sort_order", { ascending: true });

  const preparations = (preparationsData || []) as {
    id: string;
    content: string;
    sort_order: number;
  }[];

  // Fetch interview todos
  const { data: todosData } = await (supabase
    .from("interview_todos") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("hearing_request_id", id)
    .order("sort_order", { ascending: true });

  const todos = (todosData || []) as {
    id: string;
    content: string;
    sort_order: number;
  }[];

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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: Main Section */}
        <div className="space-y-6">
          {/* Interview Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preparations */}
              {preparations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Before You Start
                  </h3>
                  <ul className="space-y-2">
                    {preparations.map((prep) => (
                      <li key={prep.id} className="flex items-start gap-3 text-muted-foreground">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {prep.sort_order + 1}
                        </span>
                        <span>{prep.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TODOs */}
              {todos.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-green-600" />
                    Tasks to Complete
                  </h3>
                  <ul className="space-y-2">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-start gap-3 text-muted-foreground">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium">
                          {todo.sort_order + 1}
                        </span>
                        <span>{todo.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preparations.length === 0 && todos.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No specific preparation or tasks defined for this interview.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hearing Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>About This Hearing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hearing.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {hearing.description}
                  </p>
                </div>
              )}

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
            </CardContent>
          </Card>
        </div>

        {/* Right: Start Session */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Start Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {hearing.estimated_duration
                      ? `About ${hearing.estimated_duration} min`
                      : "About 15-30 min"}
                  </p>
                </div>
              </div>
              {(hearing.reward_per_user || hearing.reward_amount) && (
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reward</p>
                    <p className="font-medium text-green-600">
                      {hearing.reward_per_user
                        ? `¥${hearing.reward_per_user.toLocaleString()}`
                        : hearing.reward_type === "cash"
                          ? `$${hearing.reward_amount?.toLocaleString()}`
                          : `${hearing.reward_amount} points`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <form action={startSession} className="w-full">
                <Button type="submit" className="w-full">
                  Start Session
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                By participating, you agree to the Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
