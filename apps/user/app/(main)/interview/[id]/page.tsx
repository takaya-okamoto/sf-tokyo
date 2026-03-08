"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { useInterviewChat, getMessageText } from "@/hooks/useInterviewChat";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [hearingTitle, setHearingTitle] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [needsGreeting, setNeedsGreeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingSentRef = useRef(false);

  const handleMessagesLoaded = useCallback(() => {
    // Check if we need to send initial greeting
    setNeedsGreeting(true);
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isLoadingHistory,
    sendMessage,
  } = useInterviewChat({
    sessionId: id,
    onMessagesLoaded: handleMessagesLoaded,
  });

  // Fetch hearing title
  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchData() {
      const { data } = await supabase
        .from("interview_sessions")
        .select(`
          *,
          hearing_request:hearing_requests(title)
        `)
        .eq("id", id)
        .single();

      const session = data as {
        hearing_request: { title: string } | null;
      } | null;

      if (session?.hearing_request) {
        setHearingTitle(session.hearing_request.title);
      }
    }

    fetchData();
  }, [id]);

  // Send initial greeting if no messages exist
  useEffect(() => {
    if (
      needsGreeting &&
      !isLoadingHistory &&
      messages.length === 0 &&
      !greetingSentRef.current
    ) {
      greetingSentRef.current = true;
      // Trigger the AI to send the first message by sending a system trigger
      sendMessage({ text: "[START_INTERVIEW]" });
    }
  }, [needsGreeting, isLoadingHistory, messages.length, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleComplete() {
    setIsCompleting(true);

    try {
      // Call summarize API
      await fetch("/api/interview/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });

      const supabase = createBrowserClient();

      // Update session status
      await (supabase.from("interview_sessions") as ReturnType<typeof supabase.from>)
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", id);

      router.push("/history");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      setIsCompleting(false);
    }
  }

  // Filter out the system trigger message for display
  const displayMessages = messages.filter(
    (m) => getMessageText(m) !== "[START_INTERVIEW]"
  );

  const userMessageCount = displayMessages.filter((m) => m.role === "user").length;
  const canEndInterview = userMessageCount >= 1;

  if (isLoadingHistory) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hearingTitle}</h1>
        <p className="text-muted-foreground">
          AI Interview - Tell us about your experience
        </p>
      </div>

      <div className="flex gap-4">
        <Card className="h-[500px] flex flex-col flex-1">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {displayMessages.map((message) => (
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
                  <p className="text-sm whitespace-pre-wrap">{getMessageText(message)}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        <Card className="w-64 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {canEndInterview ? (
                <p>You can end the interview whenever you&apos;re ready.</p>
              ) : (
                <p>
                  Please answer at least {1 - userMessageCount} more question
                  {1 - userMessageCount !== 1 ? "s" : ""} before ending.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleComplete}
              disabled={!canEndInterview || isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isCompleting ? "Completing..." : "End Interview"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
