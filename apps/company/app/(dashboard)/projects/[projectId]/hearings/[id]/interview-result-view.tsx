"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, cn } from "@repo/ui";
import { ArrowLeft, User, ClipboardList, FileText, Play, BarChart3, ListFilter, Sparkles, X, Loader2, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";

// --- Types ---

type Recording = {
  id: string;
  recording_type: string;
  storage_path: string;
  duration: number | null;
  signedUrl: string | null;
};

type Summary = {
  summary: string;
  key_insights: unknown;
};

type SurveyResponse = {
  question: string;
  question_type: string;
  phase: string;
  text_value: string | null;
  selected_labels: string[];
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

type SessionDetail = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  recordings: Recording[];
  summary: Summary | null;
  surveyResponses: SurveyResponse[];
  messages: ChatMessage[];
};

type Hearing = {
  id: string;
  title: string;
  status: string;
  estimated_duration: number | null;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  recording: { label: "Recording", className: "bg-blue-100 text-blue-700" },
  interview: { label: "Interview", className: "bg-purple-100 text-purple-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

// --- Components ---

function UserList({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: SessionDetail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {sessions.map((session) => {
        const badge = STATUS_BADGE[session.status] ?? STATUS_BADGE.pending!;
        const isSelected = session.id === selectedId;
        return (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              "w-full text-left px-3 py-3 rounded-md transition-colors",
              isSelected
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SessionOverview({ session }: { session: SessionDetail }) {
  const duration =
    session.startedAt && session.completedAt
      ? Math.round(
          (new Date(session.completedAt).getTime() -
            new Date(session.startedAt).getTime()) /
            1000 /
            60
        )
      : null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Status</p>
        <p className="text-sm font-medium mt-1">
          {STATUS_BADGE[session.status]?.label ?? session.status}
        </p>
      </div>
      <div className="border rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Started</p>
        <p className="text-sm font-medium mt-1">
          {session.startedAt
            ? new Date(session.startedAt).toLocaleString("ja-JP")
            : "-"}
        </p>
      </div>
      <div className="border rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Duration</p>
        <p className="text-sm font-medium mt-1">
          {duration !== null ? `${duration} min` : "-"}
        </p>
      </div>
    </div>
  );
}

function RecordingSection({ recordings }: { recordings: Recording[] }) {
  const screenRecording = recordings.find(
    (r) => r.recording_type === "screen"
  );
  const otherRecordings = recordings.filter(
    (r) => r.recording_type !== "screen"
  );

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4" />
            Session Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No recording available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="h-4 w-4" />
          Session Recording
          {screenRecording?.duration && (
            <span className="text-xs font-normal text-muted-foreground">
              ({Math.round(screenRecording.duration / 60)} min)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main screen recording */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {screenRecording?.signedUrl ? (
            <video
              className="w-full h-full"
              controls
              src={screenRecording.signedUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {screenRecording ? "Unable to load recording" : "No screen recording"}
              </p>
            </div>
          )}
        </div>

        {/* Other recordings (e.g., webcam) */}
        {otherRecordings.length > 0 && (
          <div className="flex gap-3">
            {otherRecordings.map((rec) => (
              <div key={rec.id} className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 capitalize">
                  {rec.recording_type}
                </p>
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  {rec.signedUrl ? (
                    <video
                      className="w-full h-full"
                      controls
                      src={rec.signedUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Unable to load
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummarySection({ summary }: { summary: Summary }) {
  const insights = Array.isArray(summary.key_insights)
    ? (summary.key_insights as string[])
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{summary.summary}</p>
        {insights.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Key Insights
            </p>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground shrink-0">-</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SurveySection({
  responses,
  phase,
  title,
}: {
  responses: SurveyResponse[];
  phase: string;
  title: string;
}) {
  const filtered = responses.filter((r) => r.phase === phase);
  if (filtered.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-medium">{r.question}</p>
              <div className="text-sm text-muted-foreground pl-3">
                {r.question_type === "text" ? (
                  <p>{r.text_value || "-"}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {r.selected_labels.length > 0
                      ? r.selected_labels.map((label, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 bg-muted rounded text-xs"
                          >
                            {label}
                          </span>
                        ))
                      : "-"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChatSection({ messages }: { messages: ChatMessage[] }) {
  // Filter out system messages like [START_INTERVIEW]
  const filteredMessages = messages.filter(
    (m) => !m.content.includes("[START_INTERVIEW]")
  );

  if (filteredMessages.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No chat history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat History
          <span className="text-xs font-normal text-muted-foreground">
            ({filteredMessages.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredMessages.map((message) => (
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
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString("ja-JP")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- AI Improvement Tasks ---

const MAX_VISIBLE_TASKS = 3;

type ImprovementTask = {
  id: string;
  content: string;
  reason: string;
  dismissed: boolean;
};

function generateTasksFromInsights(insights: string[]): ImprovementTask[] {
  const tasks: { content: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const insight of insights) {
    const lower = insight.toLowerCase();

    let content = "";
    let key = "";
    if (lower.includes("settings") && lower.includes("nav")) {
      key = "settings-nav";
      content = "Move Settings to the top navigation bar for better discoverability";
    } else if (lower.includes("confirmation") && lower.includes("invite")) {
      key = "invite-confirm";
      content = "Add a confirmation dialog to the member invite flow";
    } else if (lower.includes("onboarding") && lower.includes("wizard")) {
      key = "onboarding-wizard";
      content = "Redesign onboarding as a step-by-step wizard to reduce initial overwhelm";
    } else if (lower.includes("terminolog")) {
      key = "terminology";
      content = "Review and simplify product terminology to be more user-friendly";
    } else if (lower.includes("dark mode")) {
      key = "dark-mode";
      content = "Implement dark mode theme support";
    } else if (lower.includes("real-time") && lower.includes("collaborat")) {
      key = "realtime";
      content = "Add real-time collaboration indicators (who is viewing a project)";
    } else if (lower.includes("performance") && lower.includes("rated")) {
      key = "performance";
      content = "Continue monitoring and maintaining high performance standards";
    } else if (lower.includes("recommend")) {
      key = "recommend";
      content = "Leverage positive user sentiment for testimonials and referral programs";
    } else if (lower.includes("responsive") || lower.includes("desktop")) {
      key = "responsive";
      content = "Improve and test mobile responsive experience across devices";
    } else if (lower.includes("sdk")) {
      key = "sdk";
      content = "Expand SDK documentation and add more integration examples";
    } else {
      key = `insight-${tasks.length}`;
      content = `Investigate and address: ${insight}`;
    }

    if (seen.has(key)) continue;
    seen.add(key);

    const reason = `**Insight from user feedback:**\n\n> ${insight}\n\n**Why this matters:**\n\nThis was identified as a key finding from the interview sessions. Addressing this will improve the overall user experience and increase satisfaction.`;

    tasks.push({ content, reason });
  }

  return tasks.map((t, i) => ({
    id: `task-${i}`,
    content: t.content,
    reason: t.reason,
    dismissed: false,
  }));
}

function AIImprovementTasks({ insights, hearingId }: { insights: string[]; hearingId: string }) {
  const [allTasks, setAllTasks] = useState<ImprovementTask[]>(() =>
    generateTasksFromInsights(insights)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  const [createdPRs, setCreatedPRs] = useState<Record<string, { prUrl: string; prNumber: number }>>({});
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const visibleTasks = allTasks
    .filter((t) => !t.dismissed)
    .slice(0, MAX_VISIBLE_TASKS);
  const totalRemaining = allTasks.filter((t) => !t.dismissed).length;

  function dismissTask(id: string) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissed: true } : t))
    );
    if (expandedId === id) setExpandedId(null);
  }

  async function fixWithAI(task: ImprovementTask) {
    const { id } = task;
    setFixingIds((prev) => new Set(prev).add(id));
    setErrorIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: id,
          taskContent: task.content,
          taskReason: task.reason,
          hearingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PR");
      }

      setCreatedPRs((prev) => ({
        ...prev,
        [id]: { prUrl: data.prUrl, prNumber: data.prNumber },
      }));
    } catch (error) {
      console.error("Failed to create PR:", error);
      setErrorIds((prev) => new Set(prev).add(id));
    } finally {
      setFixingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (visibleTasks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Suggested Improvements
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalRemaining} remaining
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleTasks.map((task) => {
            const isExpanded = expandedId === task.id;
            const isFixing = fixingIds.has(task.id);
            const hasError = errorIds.has(task.id);
            const createdPR = createdPRs[task.id];
            return (
              <div
                key={task.id}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex items-start gap-2 p-3">
                  {/* Clickable area: chevron + task content */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : task.id)
                    }
                    className="flex items-start gap-2 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className="p-0.5 mt-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title={isExpanded ? "Hide reason" : "Show reason"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                    <p className="text-sm flex-1 leading-relaxed">
                      {task.content}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {createdPR ? (
                      <a
                        href={createdPR.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        PR #{createdPR.prNumber}
                      </a>
                    ) : (
                      <button
                        onClick={() => fixWithAI(task)}
                        disabled={isFixing}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                          isFixing
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : hasError
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        {isFixing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {isFixing ? "Creating PR..." : hasError ? "Retry" : "Fix with AI"}
                      </button>
                    )}
                    <button
                      onClick={() => dismissTask(task.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Dismiss task"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reason (markdown-style) */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 ml-7">
                    <div className="bg-muted/50 rounded-md p-3 text-sm space-y-2 prose-sm">
                      {task.reason.split("\n\n").map((block, i) => {
                        if (block.startsWith("> ")) {
                          return (
                            <blockquote
                              key={i}
                              className="border-l-2 border-primary/40 pl-3 text-muted-foreground italic"
                            >
                              {block.replace(/^> /, "")}
                            </blockquote>
                          );
                        }
                        if (block.startsWith("**") && block.endsWith("**")) {
                          return (
                            <p key={i} className="font-semibold">
                              {block.replace(/\*\*/g, "")}
                            </p>
                          );
                        }
                        return <p key={i}>{block.replace(/\*\*/g, "")}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Overview Panel ---

function OverviewPanel({ sessions, hearing }: { sessions: SessionDetail[]; hearing: Hearing }) {
  const completed = sessions.filter((s) => s.status === "completed");
  const inProgress = sessions.filter(
    (s) => s.status === "recording" || s.status === "interview"
  );
  const pending = sessions.filter((s) => s.status === "pending");

  // Aggregate summaries
  const allInsights = completed.flatMap((s) => {
    if (!s.summary) return [];
    return Array.isArray(s.summary.key_insights)
      ? (s.summary.key_insights as string[])
      : [];
  });

  // Aggregate survey responses
  const allResponses = completed.flatMap((s) => s.surveyResponses);
  const feedbackResponses = allResponses.filter((r) => r.phase === "feedback");

  // Group by question for aggregation
  const questionAgg: Record<
    string,
    { question: string; type: string; texts: string[]; labels: Record<string, number> }
  > = {};
  for (const r of feedbackResponses) {
    if (!questionAgg[r.question]) {
      questionAgg[r.question] = {
        question: r.question,
        type: r.question_type,
        texts: [],
        labels: {},
      };
    }
    const agg = questionAgg[r.question]!;
    if (r.question_type === "text" && r.text_value) {
      agg.texts.push(r.text_value);
    }
    for (const label of r.selected_labels) {
      agg.labels[label] = (agg.labels[label] ?? 0) + 1;
    }
  }

  // Average duration
  const durations = completed
    .filter((s) => s.startedAt && s.completedAt)
    .map(
      (s) =>
        (new Date(s.completedAt!).getTime() -
          new Date(s.startedAt!).getTime()) /
        1000 /
        60
    );
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-xs text-muted-foreground">
            Aggregated results from all participants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{sessions.length}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {completed.length}
          </p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {inProgress.length}
          </p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Avg. Duration</p>
          <p className="text-2xl font-bold mt-1">
            {avgDuration !== null ? `${avgDuration}m` : "-"}
          </p>
        </div>
      </div>

      {/* AI Suggested Improvements */}
      {allInsights.length > 0 && (
        <AIImprovementTasks insights={allInsights} hearingId={hearing.id} />
      )}

      {/* Key Insights (aggregated from all summaries) */}
      {allInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Key Insights
              <span className="text-xs font-normal text-muted-foreground">
                (from {completed.length} completed sessions)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {allInsights.map((insight, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground shrink-0">-</span>
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Feedback Aggregation */}
      {Object.keys(questionAgg).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.values(questionAgg).map((agg, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">{agg.question}</p>

                {/* Show label distribution for radio/checkbox */}
                {Object.keys(agg.labels).length > 0 && (
                  <div className="space-y-1.5 pl-3">
                    {Object.entries(agg.labels)
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => {
                        const pct = Math.round(
                          (count / completed.length) * 100
                        );
                        return (
                          <div key={label} className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span>{label}</span>
                                <span className="text-muted-foreground">
                                  {count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Show text responses */}
                {agg.texts.length > 0 && (
                  <div className="space-y-1 pl-3">
                    {agg.texts.map((text, j) => (
                      <p
                        key={j}
                        className="text-sm text-muted-foreground border-l-2 border-muted pl-2"
                      >
                        {text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Individual summaries */}
      {completed.some((s) => s.summary) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Individual Summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completed
              .filter((s) => s.summary)
              .map((s) => (
                <div key={s.id} className="border-l-2 border-muted pl-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {s.displayName}
                  </p>
                  <p className="text-sm">{s.summary!.summary}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main ---

const OVERVIEW_ID = "__overview__";

export function InterviewResultView({
  hearing,
  sessions,
  projectId,
}: {
  hearing: Hearing;
  sessions: SessionDetail[];
  projectId: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(OVERVIEW_ID);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const isOverview = selectedId === OVERVIEW_ID;
  const filteredSessions =
    statusFilter === "all"
      ? sessions
      : sessions.filter((s) => s.status === statusFilter);
  const selectedSession = isOverview
    ? null
    : sessions.find((s) => s.id === selectedId);

  // Collect unique statuses for filter options
  const statusCounts: Record<string, number> = {};
  for (const s of sessions) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{hearing.title}</h1>
          <p className="text-sm text-muted-foreground">
            {sessions.length} participants
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No participants yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Left: Overview + User List */}
          <div className="w-[280px] shrink-0 border rounded-lg flex flex-col max-h-[calc(100vh-140px)]">
            {/* Overview button - fixed at top */}
            <div className="p-3 border-b shrink-0">
              <button
                onClick={() => setSelectedId(OVERVIEW_ID)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-md transition-colors flex items-center gap-2",
                  isOverview
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Overview</p>
                  <p className="text-[10px] text-muted-foreground">
                    All participants
                  </p>
                </div>
              </button>
            </div>

            {/* Header + Filter + User list - scrollable */}
            <div className="overflow-y-auto flex-1">
              <div className="px-3 pt-3 pb-1 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Participants
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen((v) => !v)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        filterOpen || statusFilter !== "all"
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Filter participants"
                    >
                      <ListFilter className="h-4 w-4" />
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 top-full mt-1 z-10 w-44 bg-background border rounded-lg shadow-lg py-1">
                        <button
                          onClick={() => { setStatusFilter("all"); setFilterOpen(false); }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors",
                            statusFilter === "all"
                              ? "font-semibold text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          All ({sessions.length})
                        </button>
                        {Object.entries(statusCounts).map(([status, count]) => {
                          const badge = STATUS_BADGE[status];
                          return (
                            <button
                              key={status}
                              onClick={() => { setStatusFilter(status); setFilterOpen(false); }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                                statusFilter === status
                                  ? "font-semibold text-primary"
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              {badge?.label ?? status} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3">
                {filteredSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No participants match this filter.
                  </p>
                ) : (
                  <UserList
                    sessions={filteredSessions}
                    selectedId={isOverview ? null : selectedId}
                    onSelect={setSelectedId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {isOverview ? (
              <OverviewPanel sessions={sessions} hearing={hearing} />
            ) : selectedSession ? (
              <>
                {/* User header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedSession.displayName}
                    </h2>
                    {selectedSession.email && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSession.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overview */}
                <SessionOverview session={selectedSession} />

                {/* Recording */}
                <RecordingSection recordings={selectedSession.recordings} />

                {/* AI Summary */}
                {selectedSession.summary && (
                  <SummarySection summary={selectedSession.summary} />
                )}

                {/* Chat History */}
                <ChatSection messages={selectedSession.messages} />

                {/* Pre-Survey */}
                <SurveySection
                  responses={selectedSession.surveyResponses}
                  phase="pre_survey"
                  title="Pre-Interview Survey"
                />

                {/* Feedback */}
                <SurveySection
                  responses={selectedSession.surveyResponses}
                  phase="feedback"
                  title="Feedback"
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    Select a participant from the left to view results.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
