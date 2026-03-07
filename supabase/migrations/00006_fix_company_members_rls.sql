-- Fix company_members RLS policy to allow users to read their own records
-- The current policy requires being a company member to read company_members,
-- but we need to be able to read our own record first to know which company we belong to.

-- Add a direct policy allowing users to see their own membership records
CREATE POLICY "Users can view their own membership"
  ON company_members FOR SELECT
  USING (user_id = auth.uid());
