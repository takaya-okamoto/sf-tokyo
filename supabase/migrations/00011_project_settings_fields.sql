-- プロジェクトに目的・想定ユーザーカラムを追加
ALTER TABLE projects ADD COLUMN purpose TEXT;
ALTER TABLE projects ADD COLUMN target_user TEXT;

-- interview_personasにcountryカラムを追加
ALTER TABLE interview_personas ADD COLUMN country TEXT;
