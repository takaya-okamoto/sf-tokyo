import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get hearing with its project_id
  const { data: hearingData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("project_id")
    .eq("id", id)
    .single();

  const hearing = hearingData as { project_id: string | null } | null;

  if (!hearing) {
    notFound();
  }

  if (hearing.project_id) {
    redirect(`/projects/${hearing.project_id}/hearings/${id}`);
  } else {
    // Old hearing without project, redirect to projects list
    redirect("/projects");
  }
}
