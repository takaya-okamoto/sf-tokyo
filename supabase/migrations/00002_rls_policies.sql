-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interview_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Companies policies
CREATE POLICY "Company members can view their company"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update their company"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create companies"
  ON companies FOR INSERT
  WITH CHECK (true);

-- Company members policies
CREATE POLICY "Members can view their company members"
  ON company_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage company members"
  ON company_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can delete company members"
  ON company_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'
    )
  );

-- Hearing requests policies
CREATE POLICY "Anyone can view active hearing requests"
  ON hearing_requests FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = hearing_requests.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create hearing requests"
  ON hearing_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = hearing_requests.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update their hearing requests"
  ON hearing_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = hearing_requests.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- Interview sessions policies
CREATE POLICY "Users can view their own sessions"
  ON interview_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM hearing_requests hr
      JOIN company_members cm ON cm.company_id = hr.company_id
      WHERE hr.id = interview_sessions.hearing_request_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON interview_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Recordings policies
CREATE POLICY "Session owners and company members can view recordings"
  ON recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = recordings.session_id
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM hearing_requests hr
          JOIN company_members cm ON cm.company_id = hr.company_id
          WHERE hr.id = s.hearing_request_id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session owners can create recordings"
  ON recordings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = recordings.session_id
      AND s.user_id = auth.uid()
    )
  );

-- Event logs policies
CREATE POLICY "Session owners and company members can view event logs"
  ON event_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = event_logs.session_id
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM hearing_requests hr
          JOIN company_members cm ON cm.company_id = hr.company_id
          WHERE hr.id = s.hearing_request_id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session owners can create event logs"
  ON event_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = event_logs.session_id
      AND s.user_id = auth.uid()
    )
  );

-- AI interview messages policies
CREATE POLICY "Session owners and company members can view messages"
  ON ai_interview_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = ai_interview_messages.session_id
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM hearing_requests hr
          JOIN company_members cm ON cm.company_id = hr.company_id
          WHERE hr.id = s.hearing_request_id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session owners can create messages"
  ON ai_interview_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = ai_interview_messages.session_id
      AND s.user_id = auth.uid()
    )
  );

-- AI interview summaries policies
CREATE POLICY "Session owners and company members can view summaries"
  ON ai_interview_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = ai_interview_summaries.session_id
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM hearing_requests hr
          JOIN company_members cm ON cm.company_id = hr.company_id
          WHERE hr.id = s.hearing_request_id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session owners can create summaries"
  ON ai_interview_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = ai_interview_summaries.session_id
      AND s.user_id = auth.uid()
    )
  );
