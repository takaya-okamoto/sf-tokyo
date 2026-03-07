-- Fix infinite recursion in RLS policies
-- The issue is that company_members SELECT policy references itself

-- Create a SECURITY DEFINER function to check company membership
-- This bypasses RLS when checking membership
CREATE OR REPLACE FUNCTION public.is_company_member(check_company_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = check_company_id
    AND company_members.user_id = auth.uid()
  );
$$;

-- Create a function to check if user is company owner/admin
CREATE OR REPLACE FUNCTION public.is_company_admin(check_company_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = check_company_id
    AND company_members.user_id = auth.uid()
    AND company_members.role IN ('owner', 'admin')
  );
$$;

-- Create a function to check if user is company owner
CREATE OR REPLACE FUNCTION public.is_company_owner(check_company_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = check_company_id
    AND company_members.user_id = auth.uid()
    AND company_members.role = 'owner'
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Company members can view their company" ON companies;
DROP POLICY IF EXISTS "Company members can update their company" ON companies;
DROP POLICY IF EXISTS "Members can view their company members" ON company_members;
DROP POLICY IF EXISTS "Owners can delete company members" ON company_members;
DROP POLICY IF EXISTS "Anyone can view active hearing requests" ON hearing_requests;
DROP POLICY IF EXISTS "Company members can create hearing requests" ON hearing_requests;
DROP POLICY IF EXISTS "Company members can update their hearing requests" ON hearing_requests;

-- Recreate companies policies using the helper function
CREATE POLICY "Company members can view their company"
  ON companies FOR SELECT
  USING (is_company_member(id));

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  USING (is_company_admin(id));

-- Recreate company_members policies
-- Users can view members of companies they belong to
CREATE POLICY "Members can view their company members"
  ON company_members FOR SELECT
  USING (is_company_member(company_id));

-- Only owners can delete members
CREATE POLICY "Owners can delete company members"
  ON company_members FOR DELETE
  USING (is_company_owner(company_id));

-- Recreate hearing_requests policies
CREATE POLICY "Anyone can view active hearing requests"
  ON hearing_requests FOR SELECT
  USING (
    status = 'active'
    OR is_company_member(company_id)
  );

CREATE POLICY "Company members can create hearing requests"
  ON hearing_requests FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Company members can update their hearing requests"
  ON hearing_requests FOR UPDATE
  USING (is_company_member(company_id));

-- Helper function to check if user can access a session (either as owner or company member)
CREATE OR REPLACE FUNCTION public.can_access_session(check_session_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = check_session_id
    AND (
      s.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM hearing_requests hr
        JOIN company_members cm ON cm.company_id = hr.company_id
        WHERE hr.id = s.hearing_request_id
        AND cm.user_id = auth.uid()
      )
    )
  );
$$;

-- Drop and recreate policies that reference company_members through joins
DROP POLICY IF EXISTS "Users can view their own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Session owners and company members can view recordings" ON recordings;
DROP POLICY IF EXISTS "Session owners and company members can view event logs" ON event_logs;
DROP POLICY IF EXISTS "Session owners and company members can view messages" ON ai_interview_messages;
DROP POLICY IF EXISTS "Session owners and company members can view summaries" ON ai_interview_summaries;

-- Recreate interview_sessions policy
CREATE POLICY "Users can view their own sessions"
  ON interview_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR can_access_session(id)
  );

-- Recreate recordings policy
CREATE POLICY "Session owners and company members can view recordings"
  ON recordings FOR SELECT
  USING (can_access_session(session_id));

-- Recreate event_logs policy
CREATE POLICY "Session owners and company members can view event logs"
  ON event_logs FOR SELECT
  USING (can_access_session(session_id));

-- Recreate ai_interview_messages policy
CREATE POLICY "Session owners and company members can view messages"
  ON ai_interview_messages FOR SELECT
  USING (can_access_session(session_id));

-- Recreate ai_interview_summaries policy
CREATE POLICY "Session owners and company members can view summaries"
  ON ai_interview_summaries FOR SELECT
  USING (can_access_session(session_id));
