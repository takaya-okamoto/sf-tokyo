import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { InterviewResultView } from "./interview-result-view";

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>;
}) {
  const { projectId, id } = await params;
  const supabase = await createServerClient();

  // Get hearing request
  const { data: hearingData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  const hearing = hearingData as {
    id: string;
    title: string;
    description: string | null;
    target_url: string;
    instructions: string | null;
    status: string;
    estimated_duration: number | null;
    reward_per_user: number | null;
    total_budget_cap: number | null;
    created_at: string;
  } | null;

  if (!hearing) {
    notFound();
  }

  // Get sessions with user profiles
  const { data: sessionsData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      id,
      user_id,
      status,
      started_at,
      completed_at,
      created_at
    `)
    .eq("hearing_request_id", id)
    .order("created_at", { ascending: false });

  type SessionRow = {
    id: string;
    user_id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
  };

  const sessions = (sessionsData as SessionRow[] | null) ?? [];

  // Get profiles for all session users
  const userIds = [...new Set(sessions.map((s) => s.user_id))];
  let profiles: Record<string, { display_name: string | null; email: string }> = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await (supabase
      .from("profiles") as ReturnType<typeof supabase.from>)
      .select("id, display_name, email")
      .in("id", userIds);

    const profileRows = (profilesData as Array<{
      id: string;
      display_name: string | null;
      email: string;
    }> | null) ?? [];

    for (const p of profileRows) {
      profiles[p.id] = { display_name: p.display_name, email: p.email };
    }
  }

  const sessionIds = sessions.map((s) => s.id);

  // Get recordings for all sessions
  let recordingsBySession: Record<string, Array<{
    id: string;
    recording_type: string;
    storage_path: string;
    duration: number | null;
  }>> = {};

  if (sessionIds.length > 0) {
    const { data: recordingsData } = await (supabase
      .from("recordings") as ReturnType<typeof supabase.from>)
      .select("id, session_id, recording_type, storage_path, duration")
      .in("session_id", sessionIds);

    const recordings = (recordingsData as Array<{
      id: string;
      session_id: string;
      recording_type: string;
      storage_path: string;
      duration: number | null;
    }> | null) ?? [];

    for (const r of recordings) {
      if (!recordingsBySession[r.session_id]) {
        recordingsBySession[r.session_id] = [];
      }
      recordingsBySession[r.session_id]!.push({
        id: r.id,
        recording_type: r.recording_type,
        storage_path: r.storage_path,
        duration: r.duration,
      });
    }
  }

  // Get AI summaries for all sessions
  let summariesBySession: Record<string, {
    summary: string;
    key_insights: unknown;
  }> = {};

  if (sessionIds.length > 0) {
    const { data: summariesData } = await (supabase
      .from("ai_interview_summaries") as ReturnType<typeof supabase.from>)
      .select("session_id, summary, key_insights")
      .in("session_id", sessionIds);

    const summaries = (summariesData as Array<{
      session_id: string;
      summary: string;
      key_insights: unknown;
    }> | null) ?? [];

    for (const s of summaries) {
      summariesBySession[s.session_id] = {
        summary: s.summary,
        key_insights: s.key_insights,
      };
    }
  }

  // Get survey responses for all sessions
  let surveyResponsesBySession: Record<string, Array<{
    question: string;
    question_type: string;
    phase: string;
    text_value: string | null;
    selected_labels: string[];
  }>> = {};

  if (sessionIds.length > 0) {
    const { data: responsesData } = await (supabase
      .from("survey_responses") as ReturnType<typeof supabase.from>)
      .select(`
        id,
        session_id,
        text_value,
        question:survey_questions(question, question_type, phase)
      `)
      .in("session_id", sessionIds);

    type ResponseRow = {
      id: string;
      session_id: string;
      text_value: string | null;
      question: { question: string; question_type: string; phase: string } | null;
    };

    const responses = (responsesData as ResponseRow[] | null) ?? [];

    // Get selections for these responses
    const responseIds = responses.map((r) => r.id);
    let selectionsByResponse: Record<string, string[]> = {};

    if (responseIds.length > 0) {
      const { data: selectionsData } = await (supabase
        .from("survey_response_selections") as ReturnType<typeof supabase.from>)
        .select(`
          response_id,
          option:survey_question_options(label)
        `)
        .in("response_id", responseIds);

      type SelectionRow = {
        response_id: string;
        option: { label: string } | null;
      };

      const selections = (selectionsData as SelectionRow[] | null) ?? [];
      for (const sel of selections) {
        if (!selectionsByResponse[sel.response_id]) {
          selectionsByResponse[sel.response_id] = [];
        }
        if (sel.option) {
          selectionsByResponse[sel.response_id]!.push(sel.option.label);
        }
      }
    }

    for (const r of responses) {
      if (!r.question) continue;
      if (!surveyResponsesBySession[r.session_id]) {
        surveyResponsesBySession[r.session_id] = [];
      }
      surveyResponsesBySession[r.session_id]!.push({
        question: r.question.question,
        question_type: r.question.question_type,
        phase: r.question.phase,
        text_value: r.text_value,
        selected_labels: selectionsByResponse[r.id] ?? [],
      });
    }
  }

  // Build props for client component
  const sessionsWithDetails = sessions.map((s) => {
    const profile = profiles[s.user_id];
    return {
      id: s.id,
      userId: s.user_id,
      displayName: profile?.display_name || profile?.email || "Anonymous",
      email: profile?.email ?? "",
      status: s.status,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      createdAt: s.created_at,
      recordings: recordingsBySession[s.id] ?? [],
      summary: summariesBySession[s.id] ?? null,
      surveyResponses: surveyResponsesBySession[s.id] ?? [],
    };
  });

  return (
    <InterviewResultView
      hearing={hearing}
      sessions={sessionsWithDetails}
      projectId={projectId}
    />
  );
}
