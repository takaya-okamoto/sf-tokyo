import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createServerClient();

  // Get session with its hearing's project_id
  const { data: sessionData } = await (supabase
    .from("interview_sessions") as ReturnType<typeof supabase.from>)
    .select(`
      hearing_request:hearing_requests(project_id)
    `)
    .eq("id", sessionId)
    .single();

  const session = sessionData as {
    hearing_request: { project_id: string | null } | null;
  } | null;

  if (!session) {
    notFound();
  }

  const projectId = session.hearing_request?.project_id;

  if (projectId) {
    redirect(`/projects/${projectId}/results/${sessionId}`);
  } else {
    // Old session without project, redirect to projects list
    redirect("/projects");
  }
}
