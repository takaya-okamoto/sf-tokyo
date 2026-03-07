import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerClient();

  // Verify project exists and user has access
  const { data: projectData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("id")
    .eq("id", projectId)
    .single();

  if (!projectData) {
    notFound();
  }

  return <>{children}</>;
}
