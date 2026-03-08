import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { HearingEditForm } from "./hearing-edit-form";

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>;
}) {
  const { projectId, id } = await params;
  const supabase = await createServerClient();

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
    status: "draft" | "active" | "paused" | "completed" | "archived";
    company_id: string;
    project_id: string;
    reward_amount: number | null;
    reward_type: string | null;
    max_participants: number | null;
    estimated_duration: number | null;
    reward_per_user: number | null;
    total_budget_cap: number | null;
    created_at: string;
    updated_at: string;
  } | null;

  if (!hearing) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <HearingEditForm hearing={hearing} projectId={projectId} />
    </div>
  );
}
