import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface SdkEvent {
  eventType: string;
  targetSelector?: string;
  pageUrl: string;
  pageTitle?: string;
  scrollDepth?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  xPosition?: number;
  yPosition?: number;
  elapsedMs: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface IngestRequest {
  sessionId: string;
  events: SdkEvent[];
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
    const body: IngestRequest = await req.json();
    const { sessionId, events } = body;

    if (!sessionId || !events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: "sessionId and events array are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // イベントデータを変換
    const eventRows = events.map((event) => ({
      session_id: sessionId,
      event_type: event.eventType,
      target_selector: event.targetSelector || null,
      page_url: event.pageUrl,
      page_title: event.pageTitle || null,
      scroll_depth: event.scrollDepth ?? null,
      viewport_width: event.viewportWidth ?? null,
      viewport_height: event.viewportHeight ?? null,
      x_position: event.xPosition ?? null,
      y_position: event.yPosition ?? null,
      elapsed_ms: event.elapsedMs,
      metadata: event.metadata || null,
      timestamp: event.timestamp,
    }));

    // バッチインサート
    const { error: insertError } = await supabase
      .from("sdk_events")
      .insert(eventRows);

    if (insertError) {
      console.error("Error inserting events:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert events" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 最終アクティビティ時刻を更新
    await supabase
      .from("interview_sessions")
      .update({
        sdk_last_activity_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({ success: true, inserted: events.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sdk-ingest-events:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
