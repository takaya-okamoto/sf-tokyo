import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function ResultsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get first project for the company to redirect to
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company_id: string } | null;

  const { data: projectData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("id")
    .eq("company_id", companyMember?.company_id ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const project = projectData as { id: string } | null;

  if (project) {
    redirect(`/projects/${project.id}/results`);
  } else {
    redirect("/projects");
  }
}
