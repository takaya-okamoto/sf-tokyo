-- projectsテーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_company ON projects(company_id);

-- hearing_requestsにproject_id追加
ALTER TABLE hearing_requests
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_hearing_requests_project ON hearing_requests(project_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- プロジェクトメンバー確認関数
CREATE OR REPLACE FUNCTION public.is_project_member(check_project_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN company_members cm ON cm.company_id = p.company_id
    WHERE p.id = check_project_id AND cm.user_id = auth.uid()
  );
$$;

-- RLSポリシー
CREATE POLICY "Company members can view their projects"
  ON projects FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Company members can create projects"
  ON projects FOR INSERT WITH CHECK (is_company_member(company_id));

CREATE POLICY "Company members can update their projects"
  ON projects FOR UPDATE USING (is_company_member(company_id));

CREATE POLICY "Company admins can delete projects"
  ON projects FOR DELETE USING (is_company_admin(company_id));

-- updated_atトリガー
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
