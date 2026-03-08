import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface MarkReturnedRequest {
  sessionId: string;
  pageUrl: string;
  elapsedMs: number;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body: MarkReturnedRequest = await req.json();
    const { sessionId, pageUrl, elapsedMs } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userAppUrl = Deno.env.get("USER_APP_URL") || "http://user.localhost:3002";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // セッションの存在確認
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 戻りボタンクリックイベントを記録
    await supabase.from("sdk_events").insert({
      session_id: sessionId,
      event_type: "return_button_click",
      page_url: pageUrl || "unknown",
      elapsed_ms: elapsedMs || 0,
      timestamp: new Date().toISOString(),
    });

    // 最終アクティビティ時刻を更新
    await supabase
      .from("interview_sessions")
      .update({
        sdk_last_activity_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    const returnUrl = `${userAppUrl}/session/${sessionId}/recording?action=stop`;

    return new Response(
      JSON.stringify({ success: true, returnUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sdk-mark-returned:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
