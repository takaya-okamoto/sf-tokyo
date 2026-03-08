import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const SummarySchema = z.object({
  summary: z.string().describe("A comprehensive summary of the interview feedback"),
  keyInsights: z.array(z.string()).describe("Key insights extracted from the interview (3-5 bullet points)"),
});

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId: string };

  if (!sessionId) {
    return Response.json({ error: "Session ID is required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Fetch all messages for this session
  const { data: messages } = await (
    supabase.from("ai_interview_messages") as ReturnType<typeof supabase.from>
  )
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const messageList = messages as Array<{
    role: string;
    content: string;
  }> | null;

  if (!messageList || messageList.length === 0) {
    return Response.json({ error: "No messages found" }, { status: 404 });
  }

  // Fetch hearing context
  const { data: session } = await (
    supabase.from("interview_sessions") as ReturnType<typeof supabase.from>
  )
    .select(`
      *,
      hearing_request:hearing_requests(title, description)
    `)
    .eq("id", sessionId)
    .single();

  const sessionData = session as {
    hearing_request: {
      title: string;
      description: string | null;
    } | null;
  } | null;

  const hearingTitle = sessionData?.hearing_request?.title || "the service";
  const hearingDescription =
    sessionData?.hearing_request?.description || "No description provided";

  // Format conversation for summarization
  const conversation = messageList
    .filter((m) => m.content !== "[START_INTERVIEW]")
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "User"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are analyzing a user feedback interview about "${hearingTitle}".

Product/Service Description: ${hearingDescription}

Interview Transcript:
${conversation}

Please provide:
1. A comprehensive summary (2-3 paragraphs) of the key feedback points, user sentiment, and overall experience
2. 3-5 key insights as concise bullet points that would be actionable for the product team`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: SummarySchema,
      prompt,
    });

    // Save summary to database
    const { error: insertError } = await (
      supabase.from("ai_interview_summaries") as ReturnType<typeof supabase.from>
    ).insert({
      session_id: sessionId,
      summary: object.summary,
      key_insights: object.keyInsights,
    } as never);

    if (insertError) {
      console.error("Failed to save summary:", insertError);
      return Response.json({ error: "Failed to save summary" }, { status: 500 });
    }

    return Response.json({
      success: true,
      summary: object.summary,
      keyInsights: object.keyInsights,
    });
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
