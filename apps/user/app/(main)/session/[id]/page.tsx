import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from "@repo/ui";
import { ArrowLeft, Video, Monitor, AlertCircle } from "lucide-react";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: sessionData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      hearing_request:hearing_requests(
        *,
        company:companies(name)
      )
    `)
    .eq("id", id)
    .single();

  const session = sessionData as {
    id: string;
    status: string;
    hearing_request: {
      title: string;
      target_url: string;
      instructions: string | null;
      company: { name: string } | null;
    } | null;
  } | null;

  if (!session) {
    notFound();
  }

  async function startRecording() {
    "use server";
    const supabase = await createServerClient();

    // Using type assertion to bypass RLS-induced type restrictions
    await (supabase.from("interview_sessions") as ReturnType<typeof supabase.from>)
      .update({
        status: "recording",
        started_at: new Date().toISOString(),
      } as never)
      .eq("id", id);

    redirect(`/session/${id}/recording`);
  }

  if (session.status === "recording") {
    redirect(`/session/${id}/recording`);
  }

  if (session.status === "interview") {
    redirect(`/interview/${id}`);
  }

  if (session.status === "completed") {
    redirect(`/history`);
  }

  const hearingRequest = session.hearing_request as {
    title: string;
    target_url: string;
    instructions: string | null;
    company: { name: string } | null;
  };

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
            {hearingRequest.company?.name ?? "Company"}
          </p>
          <h1 className="text-2xl font-bold">{hearingRequest.title}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pre-Session Confirmation</CardTitle>
          <CardDescription>
            Please review the following before starting the recording
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Video className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Screen Recording</p>
                <p className="text-sm text-muted-foreground">
                  Your screen will be recorded while using the service
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Interaction Logs</p>
                <p className="text-sm text-muted-foreground">
                  Clicks, scrolls, and other interactions will be recorded
                </p>
              </div>
            </div>
          </div>

          {hearingRequest.instructions && (
            <div>
              <h3 className="font-medium mb-2">Instructions</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {hearingRequest.instructions}
              </p>
            </div>
          )}

          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Important Notes</p>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>- Do not enter personal information (passwords, etc.)</li>
                <li>- Do not open other apps or tabs during recording</li>
                <li>- We recommend conducting this in a quiet environment</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <form action={startRecording} className="w-full">
            <Button type="submit" className="w-full" size="lg">
              Start Recording
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">
            You will be asked to grant screen sharing permission
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
