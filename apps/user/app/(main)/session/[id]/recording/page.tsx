"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Video, Square, ExternalLink, Clock } from "lucide-react";

export default function RecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [hearingTitle, setHearingTitle] = useState<string>("");

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchSession() {
      // Using type assertion to bypass RLS-induced type restrictions
      const { data: sessionData } = await (supabase
        .from("interview_sessions") as ReturnType<typeof supabase.from>)
        .select(`
          *,
          hearing_request:hearing_requests(title, target_url)
        `)
        .eq("id", id)
        .single();

      const session = sessionData as {
        hearing_request: { title: string; target_url: string } | null;
      } | null;

      if (session?.hearing_request) {
        // hSessionIdパラメータを追加してSDKが初期化できるようにする
        const baseUrl = session.hearing_request.target_url;
        const separator = baseUrl.includes("?") ? "&" : "?";
        const urlWithSessionId = `${baseUrl}${separator}hSessionId=${id}`;
        setTargetUrl(urlWithSessionId);
        setHearingTitle(session.hearing_request.title);
      }
    }

    fetchSession();
  }, [id]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleStartRecording() {
    // In Phase 2, this will integrate with MediaRecorder API
    // For now, simulate recording start
    setIsRecording(true);
  }

  async function handleStopRecording() {
    const supabase = createBrowserClient();

    // Update session status to interview
    // Using type assertion to bypass RLS-induced type restrictions
    await (supabase.from("interview_sessions") as ReturnType<typeof supabase.from>)
      .update({
        status: "interview",
      } as never)
      .eq("id", id);

    router.push(`/interview/${id}`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hearingTitle}</h1>
        <p className="text-muted-foreground">
          Please verbalize your thoughts while trying the service
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="order-2 md:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Target Service
            </CardTitle>
            <CardDescription>
              Click the link below to try the service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-primary hover:underline truncate">
                {targetUrl}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Opens in a new tab
              </p>
            </a>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isRecording ? (
                <>
                  <Video className="h-5 w-5 text-red-500 animate-pulse" />
                  <span className="text-red-500">Recording</span>
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  <span>Ready to Record</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-3xl font-mono">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <span>{formatDuration(duration)}</span>
            </div>

            {!isRecording ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleStartRecording}
              >
                <Video className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                variant="destructive"
                onClick={handleStopRecording}
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording & Go to Interview
              </Button>
            )}

            {isRecording && (
              <p className="text-sm text-muted-foreground text-center">
                Press &quot;Stop Recording&quot; when you finish trying the service
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {isRecording && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Recording screen and audio. Please verbalize your thoughts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
