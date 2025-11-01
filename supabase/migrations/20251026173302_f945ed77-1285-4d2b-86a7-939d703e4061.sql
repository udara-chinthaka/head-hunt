-- Add RLS policy to allow organizations to view candidates with assigned CVs
CREATE POLICY "Organizations can view candidates with assigned CVs"
ON public.candidates
FOR SELECT
USING (
  id IN (
    SELECT cv.candidate_id
    FROM cv_uploads cv
    INNER JOIN cv_assignments ca ON ca.cv_id = cv.id
    INNER JOIN organization_members om ON om.organization_id = ca.organization_id
    WHERE om.user_id = auth.uid()
  )
);