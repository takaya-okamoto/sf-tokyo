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

    const prompt = `あなたはTodo Appの改善提案を行うプロダクトマネージャーです。
以下のユーザーインタビューの内容を分析し、Todo Appの具体的な改善タスクを抽出してください。

## プロダクト情報
- 製品名: ${hearingTitle}
- 説明: ${hearingDescription || "Todo管理アプリケーション"}

## インタビュー内容
${conversation}

## 出力形式
以下のJSON形式で、3〜5個の改善タスクを出力してください。
各タスクは具体的で実装可能なものにしてください。

重要な制約:
- タスクはTodo Appのコード修正として実装可能なものに限定
- ユーザーの声を直接引用してreasonに含める
- contentは実装者が理解できる具体的な内容にする

\`\`\`json
{
  "tasks": [
    {
      "content": "具体的な改善タスクの内容（例：締め切りが近いタスクを上部に表示する機能を追加）",
      "reason": "ユーザーの声：「○○」というフィードバックがあり、これを改善することで○○が向上する"
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
