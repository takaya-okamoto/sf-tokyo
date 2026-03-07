import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { HearingEditForm } from "./hearing-edit-form";

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: hearingData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", id)
    .single();

  // Import from @repo/database types to get the proper type
  const hearing = hearingData as {
    id: string;
    title: string;
    description: string | null;
    target_url: string;
    instructions: string | null;
    status: "draft" | "active" | "paused" | "completed" | "archived";
    company_id: string;
    reward_amount: number | null;
    reward_type: string | null;
    max_participants: number | null;
    created_at: string;
    updated_at: string;
  } | null;

  if (!hearing) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <HearingEditForm hearing={hearing} />
    </div>
  );
}
