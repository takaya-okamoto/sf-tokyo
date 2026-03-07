-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('recordings', 'recordings', false, 524288000), -- 500MB limit
  ('company-assets', 'company-assets', true, 5242880); -- 5MB limit

-- Storage policies for recordings bucket
CREATE POLICY "Users can upload recordings to their sessions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recordings'
    AND EXISTS (
      SELECT 1 FROM interview_sessions s
      WHERE s.id::text = (storage.foldername(name))[1]
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Session owners and company members can view recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings'
    AND EXISTS (
      SELECT 1 FROM interview_sessions s
      JOIN hearing_requests hr ON hr.id = s.hearing_request_id
      WHERE s.id::text = (storage.foldername(name))[1]
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM company_members cm
          WHERE cm.company_id = hr.company_id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- Storage policies for company-assets bucket
CREATE POLICY "Company members can upload company assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "Company members can update company assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete company assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id::text = (storage.foldername(name))[1]
      AND cm.user_id = auth.uid()
    )
  );
