-- ユーザーがアクティブなヒアリングを持つ企業を閲覧できるようにする
CREATE POLICY "Anyone can view companies with active hearings"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hearing_requests
      WHERE hearing_requests.company_id = companies.id
      AND hearing_requests.status = 'active'
    )
  );
