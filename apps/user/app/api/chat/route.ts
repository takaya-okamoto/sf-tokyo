import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, sessionId } = (await req.json()) as {
    messages: UIMessage[];
    sessionId: string;
  };

  const supabase = await createServerClient();

  // Fetch session and hearing context
  const { data: session } = await (
    supabase.from("interview_sessions") as ReturnType<typeof supabase.from>
  )
    .select(
      `
      *,
      hearing_request:hearing_requests(
        title,
        description,
        instructions
      )
    `
    )
    .eq("id", sessionId)
    .single();

  const sessionData = session as {
    hearing_request_id: string;
    hearing_request: {
      title: string;
      description: string | null;
      instructions: string | null;
    } | null;
  } | null;

  const hearingTitle = sessionData?.hearing_request?.title || "the service";
  const hearingDescription =
    sessionData?.hearing_request?.description || "No description provided";
  const hearingInstructions =
    sessionData?.hearing_request?.instructions ||
    "Collect detailed feedback about the user experience";

  // Fetch feedback questions for this hearing
  const { data: feedbackQuestions } = await (
    supabase.from("survey_questions") as ReturnType<typeof supabase.from>
  )
    .select("question, question_type, sort_order")
    .eq("hearing_request_id", sessionData?.hearing_request_id)
    .eq("phase", "feedback")
    .order("sort_order", { ascending: true });

  const typedFeedbackQuestions = feedbackQuestions as Array<{
    question: string;
    question_type: string;
    sort_order: number;
  }> | null;

  const feedbackQuestionsText = typedFeedbackQuestions?.length
    ? typedFeedbackQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")
    : "";

  const systemPrompt = `You are a friendly and professional AI interviewer conducting a user feedback interview.

Context:
- Product/Service: ${hearingTitle}
- Description: ${hearingDescription}
- Interview Goals: ${hearingInstructions}
${feedbackQuestionsText ? `
Key Questions to Cover:
${feedbackQuestionsText}

Important: Make sure to naturally incorporate these questions during the interview. Ask them in a conversational way, not as a rigid checklist.
` : ""}
Your Role:
1. Ask appropriate follow-up questions based on the user's responses
2. Collect detailed feedback about their experience
3. Create a comfortable atmosphere for honest opinions

Guidelines:
- Keep responses concise (2-3 sentences per turn)
- Ask only one question at a time
- Use natural, conversational language
- After 5+ exchanges, you may suggest ending the interview if the user seems ready
- Be empathetic and encouraging

Special Instructions:
- If the user's message is "[START_INTERVIEW]", this is a system trigger to begin the interview. Respond with a warm greeting and ask about their first impression of the service.
- For all other messages, respond naturally as an interviewer.`;

  // Convert UIMessages to model messages
  const modelMessages = await convertToModelMessages(messages);

  // Create UI message stream
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        messages: modelMessages,
      });

      // Write text chunks to the UI message stream
      writer.write({ type: "text-start", id: "response" });

      for await (const chunk of result.textStream) {
        writer.write({ type: "text-delta", delta: chunk, id: "response" });
      }

      writer.write({ type: "text-end", id: "response" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
