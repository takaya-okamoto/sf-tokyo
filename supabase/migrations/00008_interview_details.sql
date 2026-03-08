-- Add new columns to hearing_requests for interview settings
ALTER TABLE hearing_requests
ADD COLUMN estimated_duration INTEGER, -- minutes
ADD COLUMN reward_per_user INTEGER DEFAULT 0, -- JPY
ADD COLUMN total_budget_cap INTEGER DEFAULT 0; -- JPY

-- Preparation items (Step 1)
CREATE TABLE interview_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_request_id UUID NOT NULL REFERENCES hearing_requests(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_preparations_hearing ON interview_preparations(hearing_request_id);

-- User To-Do steps (Step 1)
CREATE TABLE interview_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_request_id UUID NOT NULL REFERENCES hearing_requests(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_todos_hearing ON interview_todos(hearing_request_id);

-- Persona settings (Step 2)
CREATE TABLE interview_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_request_id UUID NOT NULL REFERENCES hearing_requests(id) ON DELETE CASCADE,
  age_min INTEGER,
  age_max INTEGER,
  gender TEXT, -- 'male' | 'female' | 'other' | null (no preference)
  occupation TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hearing_request_id)
);

CREATE TRIGGER interview_personas_updated_at
  BEFORE UPDATE ON interview_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Survey questions (Step 2 pre-survey & Step 3 feedback)
CREATE TYPE survey_question_type AS ENUM ('text', 'radio', 'checkbox');
CREATE TYPE survey_phase AS ENUM ('pre_survey', 'feedback');

CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_request_id UUID NOT NULL REFERENCES hearing_requests(id) ON DELETE CASCADE,
  phase survey_phase NOT NULL, -- pre_survey or feedback
  sort_order INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL,
  question_type survey_question_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_hearing ON survey_questions(hearing_request_id);
CREATE INDEX idx_survey_questions_phase ON survey_questions(hearing_request_id, phase);

-- Survey question options (for radio / checkbox questions)
CREATE TABLE survey_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_question_options_question ON survey_question_options(question_id);

-- Survey responses (when users answer)
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  text_value TEXT, -- for text type
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_survey_responses_session ON survey_responses(session_id);

-- Selected options for radio/checkbox responses
CREATE TABLE survey_response_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES survey_question_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(response_id, option_id)
);

CREATE INDEX idx_survey_response_selections_response ON survey_response_selections(response_id);

-- ============================
-- RLS
-- ============================

ALTER TABLE interview_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_response_selections ENABLE ROW LEVEL SECURITY;

-- Helper: check if user can access a hearing_request (company member or active)
CREATE OR REPLACE FUNCTION public.can_access_hearing(check_hearing_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hearing_requests hr
    WHERE hr.id = check_hearing_id
    AND (
      hr.status = 'active'
      OR EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = hr.company_id
        AND cm.user_id = auth.uid()
      )
    )
  );
$$;

-- Helper: check if user is company member for a hearing
CREATE OR REPLACE FUNCTION public.is_hearing_company_member(check_hearing_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hearing_requests hr
    JOIN company_members cm ON cm.company_id = hr.company_id
    WHERE hr.id = check_hearing_id
    AND cm.user_id = auth.uid()
  );
$$;

-- interview_preparations policies
CREATE POLICY "Company members can view preparations"
  ON interview_preparations FOR SELECT
  USING (can_access_hearing(hearing_request_id));

CREATE POLICY "Company members can manage preparations"
  ON interview_preparations FOR INSERT
  WITH CHECK (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can update preparations"
  ON interview_preparations FOR UPDATE
  USING (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can delete preparations"
  ON interview_preparations FOR DELETE
  USING (is_hearing_company_member(hearing_request_id));

-- interview_todos policies
CREATE POLICY "Company members can view todos"
  ON interview_todos FOR SELECT
  USING (can_access_hearing(hearing_request_id));

CREATE POLICY "Company members can manage todos"
  ON interview_todos FOR INSERT
  WITH CHECK (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can update todos"
  ON interview_todos FOR UPDATE
  USING (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can delete todos"
  ON interview_todos FOR DELETE
  USING (is_hearing_company_member(hearing_request_id));

-- interview_personas policies
CREATE POLICY "Company members can view personas"
  ON interview_personas FOR SELECT
  USING (can_access_hearing(hearing_request_id));

CREATE POLICY "Company members can manage personas"
  ON interview_personas FOR INSERT
  WITH CHECK (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can update personas"
  ON interview_personas FOR UPDATE
  USING (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can delete personas"
  ON interview_personas FOR DELETE
  USING (is_hearing_company_member(hearing_request_id));

-- survey_questions policies
CREATE POLICY "Users can view survey questions for accessible hearings"
  ON survey_questions FOR SELECT
  USING (can_access_hearing(hearing_request_id));

CREATE POLICY "Company members can manage survey questions"
  ON survey_questions FOR INSERT
  WITH CHECK (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can update survey questions"
  ON survey_questions FOR UPDATE
  USING (is_hearing_company_member(hearing_request_id));

CREATE POLICY "Company members can delete survey questions"
  ON survey_questions FOR DELETE
  USING (is_hearing_company_member(hearing_request_id));

-- survey_question_options policies (access via question -> hearing)
CREATE OR REPLACE FUNCTION public.can_access_survey_question(check_question_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM survey_questions sq
    JOIN hearing_requests hr ON hr.id = sq.hearing_request_id
    WHERE sq.id = check_question_id
    AND (
      hr.status = 'active'
      OR EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = hr.company_id
        AND cm.user_id = auth.uid()
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_survey_question_company_member(check_question_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM survey_questions sq
    JOIN hearing_requests hr ON hr.id = sq.hearing_request_id
    JOIN company_members cm ON cm.company_id = hr.company_id
    WHERE sq.id = check_question_id
    AND cm.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view survey options"
  ON survey_question_options FOR SELECT
  USING (can_access_survey_question(question_id));

CREATE POLICY "Company members can manage survey options"
  ON survey_question_options FOR INSERT
  WITH CHECK (is_survey_question_company_member(question_id));

CREATE POLICY "Company members can update survey options"
  ON survey_question_options FOR UPDATE
  USING (is_survey_question_company_member(question_id));

CREATE POLICY "Company members can delete survey options"
  ON survey_question_options FOR DELETE
  USING (is_survey_question_company_member(question_id));

-- survey_responses policies
CREATE POLICY "Users can view their own responses"
  ON survey_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = survey_responses.session_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM interview_sessions s
      JOIN hearing_requests hr ON hr.id = s.hearing_request_id
      JOIN company_members cm ON cm.company_id = hr.company_id
      WHERE s.id = survey_responses.session_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit responses"
  ON survey_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id = survey_responses.session_id
      AND s.user_id = auth.uid()
    )
  );

-- survey_response_selections policies
CREATE POLICY "Users can view their own selections"
  ON survey_response_selections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM survey_responses sr
      JOIN interview_sessions s ON s.id = sr.session_id
      WHERE sr.id = survey_response_selections.response_id
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

CREATE POLICY "Users can submit selections"
  ON survey_response_selections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_responses sr
      JOIN interview_sessions s ON s.id = sr.session_id
      WHERE sr.id = survey_response_selections.response_id
      AND s.user_id = auth.uid()
    )
  );
