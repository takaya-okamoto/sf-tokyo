import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

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

    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select(`
        id,
        status,
        hearing_request:hearing_requests(
          id,
          title,
          target_url
        )
      `)
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

    // recordingステータス以外は拒否
    if (session.status !== "recording") {
      return new Response(
        JSON.stringify({ error: "Session is not in recording state" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SDK初期化タイムスタンプを更新
    await supabase
      .from("interview_sessions")
      .update({
        sdk_initialized_at: new Date().toISOString(),
        sdk_last_activity_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    const returnUrl = `${userAppUrl}/session/${sessionId}/recording`;

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        status: session.status,
        returnUrl,
        hearingTitle: session.hearing_request?.title || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sdk-context:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
