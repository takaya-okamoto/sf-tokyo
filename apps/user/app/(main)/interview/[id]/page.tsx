"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Send, CheckCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hearingTitle, setHearingTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchData() {
      // Fetch session and hearing info
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

      // Fetch existing messages
      // Using type assertion to bypass RLS-induced type restrictions
      const { data: existingMessages } = await (supabase
        .from("ai_interview_messages") as ReturnType<typeof supabase.from>)
        .select("*")
        .eq("session_id", id)
        .order("created_at", { ascending: true });

      const messages = existingMessages as Array<{
        id: string;
        role: string;
        content: string;
      }> | null;

      if (messages && messages.length > 0) {
        setMessages(
          messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      } else {
        // Add initial AI greeting
        const greeting: Message = {
          id: "greeting",
          role: "assistant",
          content:
            "Great job! Thank you for trying the service. Let me ask you a few questions.\n\nFirst, what was your overall first impression of the service?",
        };
        setMessages([greeting]);

        // Save greeting to DB
        await (supabase.from("ai_interview_messages") as ReturnType<typeof supabase.from>).insert({
          session_id: id,
          role: "assistant",
          content: greeting.content,
        } as never);
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const supabase = createBrowserClient();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Save user message
    await (supabase.from("ai_interview_messages") as ReturnType<typeof supabase.from>).insert({
      session_id: id,
      role: "user",
      content: userMessage.content,
    } as never);

    // Simulate AI response (In Phase 2, this will use Vercel AI SDK)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const aiResponses = [
      "I see, thank you. Were there any confusing parts or areas you'd like to see improved?",
      "That's helpful. Are there any other concerns or, conversely, things you liked?",
      "Thank you for your feedback. Would you recommend this service to friends or colleagues? Please tell me why.",
      "Thank you for the detailed feedback. Lastly, do you have any additional comments or feedback?",
      "Thank you for your valuable feedback! The interview is now complete. Please press the \"Complete\" button.",
    ];

    const responseIndex = Math.min(
      messages.filter((m) => m.role === "assistant").length,
      aiResponses.length - 1
    );

    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: aiResponses[responseIndex] ?? aiResponses[aiResponses.length - 1] ?? "",
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Save AI message
    await (supabase.from("ai_interview_messages") as ReturnType<typeof supabase.from>).insert({
      session_id: id,
      role: "assistant",
      content: aiMessage.content,
    } as never);

    setLoading(false);
  }

  async function handleComplete() {
    const supabase = createBrowserClient();

    // Update session status
    await (supabase.from("interview_sessions") as ReturnType<typeof supabase.from>)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      } as never)
      .eq("id", id);

    // Create a simple summary (In Phase 2, this will use AI)
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");

    await (supabase.from("ai_interview_summaries") as ReturnType<typeof supabase.from>).insert({
      session_id: id,
      summary: `User provided the following feedback: ${userMessages.substring(0, 500)}...`,
      key_insights: ["Feedback collection completed"],
    } as never);

    router.push("/history");
  }

  const isComplete = messages.some((m) =>
    m.content.includes("The interview is now complete")
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hearingTitle}</h1>
        <p className="text-muted-foreground">
          AI Interview - Tell us about your experience
        </p>
      </div>

      <Card className="h-[500px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
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
          {isComplete ? (
            <Button className="w-full" size="lg" onClick={handleComplete}>
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete
            </Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
