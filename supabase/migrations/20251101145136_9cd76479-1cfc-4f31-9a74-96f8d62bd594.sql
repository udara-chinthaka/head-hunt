-- Drop the problematic policy on candidates table
DROP POLICY IF EXISTS "Organizations can view candidates with assigned CVs" ON public.candidates;

-- Create a security definer function to check if candidate has assigned CVs
CREATE OR REPLACE FUNCTION public.candidate_assigned_to_user_org(candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cv_uploads cv
    INNER JOIN cv_assignments ca ON ca.cv_id = cv.id
    INNER JOIN organization_members om ON om.organization_id = ca.organization_id
    WHERE cv.candidate_id = candidate_assigned_to_user_org.candidate_id
      AND om.user_id = auth.uid()
  )
$$;

-- Create policy using the security definer function
CREATE POLICY "Organizations can view candidates with assigned CVs"
ON public.candidates
FOR SELECT
USING (public.candidate_assigned_to_user_org(id));

-- Add policy for candidates to view recruiter actions on their own CVs
CREATE POLICY "Candidates can view recruiter actions on their CVs"
ON public.recruiter_actions
FOR SELECT
USING (
  cv_id IN (
    SELECT cv.id
    FROM cv_uploads cv
    INNER JOIN candidates c ON c.id = cv.candidate_id
    WHERE c.user_id = auth.uid()
  )
);