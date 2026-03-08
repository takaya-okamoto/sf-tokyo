-- interview_sessionsにSDK関連カラム追加
ALTER TABLE interview_sessions
ADD COLUMN sdk_initialized_at TIMESTAMPTZ,
ADD COLUMN sdk_last_activity_at TIMESTAMPTZ;

-- SDKイベント専用テーブル
CREATE TABLE sdk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_selector TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  scroll_depth INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  x_position INTEGER,
  y_position INTEGER,
  elapsed_ms INTEGER NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_sdk_events_session ON sdk_events(session_id);
CREATE INDEX idx_sdk_events_session_timestamp ON sdk_events(session_id, timestamp);

-- RLS
ALTER TABLE sdk_events ENABLE ROW LEVEL SECURITY;

-- SDKイベントはEdge Functionから挿入されるため、service roleでのみ書き込み可能
-- 読み取りは関連するセッションの所有者（企業メンバー）のみ
CREATE POLICY "Company members can view SDK events for their sessions"
  ON sdk_events FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      JOIN hearing_requests hr ON hr.id = s.hearing_request_id
      JOIN company_members cm ON cm.company_id = hr.company_id
      WHERE s.id = sdk_events.session_id AND cm.user_id = auth.uid()
    )
  );

-- インサートはservice roleのみ（Edge Functionから使用）
-- Anon/authenticated userは直接インサートできない
