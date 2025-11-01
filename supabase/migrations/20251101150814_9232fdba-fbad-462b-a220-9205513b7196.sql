-- Drop existing RLS policy for organizations viewing assigned candidates
DROP POLICY IF EXISTS "Organizations can view candidates with assigned CVs" ON public.candidates;

-- Create a new policy that restricts hired candidates to only the hiring organization
CREATE POLICY "Organizations can view candidates with assigned CVs"
ON public.candidates
FOR SELECT
USING (
  CASE 
    -- If candidate has been hired, only the hiring organization can see them
    WHEN EXISTS (
      SELECT 1 FROM public.billing 
      WHERE billing.candidate_id = candidates.id 
      AND billing.status = 'paid'
    ) THEN EXISTS (
      SELECT 1 FROM public.billing 
      WHERE billing.candidate_id = candidates.id 
      AND billing.organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
      AND billing.status = 'paid'
    )
    -- Otherwise, any organization with assigned CVs can see them
    ELSE public.candidate_assigned_to_user_org(id)
  END
);