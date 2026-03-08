import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type ChatMessage = {
  role: string;
  content: string;
};

type RequestBody = {
  hearingTitle: string;
  hearingDescription?: string;
  messages: ChatMessage[];
};

type ImprovementTask = {
  id: string;
  content: string;
  reason: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { hearingTitle, hearingDescription, messages } = body;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No chat messages provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Format conversation for analysis
    const conversation = messages
      .filter((m) => m.content !== "[START_INTERVIEW]")
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "User"}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are a product manager proposing improvements for a Todo App.
Analyze the following user interview and extract specific improvement tasks for the Todo App.

## Product Information
- Product Name: ${hearingTitle}
- Description: ${hearingDescription || "Todo management application"}

## Interview Content
${conversation}

## Output Format
Output 3-5 improvement tasks in the following JSON format.
Each task should be specific and implementable.

Important constraints:
- Tasks must be implementable as code changes to the Todo App
- Include direct quotes from the user in the reason
- Content should be specific enough for a developer to understand

\`\`\`json
{
  "tasks": [
    {
      "content": "Specific improvement task (e.g., Add feature to display tasks with approaching deadlines at the top)",
      "reason": "User feedback: \"[quote from user]\" - Addressing this will improve [specific benefit]"
    }
  ]
}
\`\`\`
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "OpenAI returned empty response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as { tasks: Array<{ content: string; reason: string }> };

    const tasks: ImprovementTask[] = parsed.tasks.map((task, index) => ({
      id: `task-${Date.now()}-${index}`,
      content: task.content,
      reason: task.reason,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error generating improvements:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate improvements",
      },
      { status: 500 }
    );
  }
}
