-- Revert overly restrictive SELECT policies and allow all admins to view results
-- Ensure function exists (created previously), otherwise create it
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;

-- Responses: allow all admins (any user with admin_users record) to view all responses
DROP POLICY IF EXISTS "Admins can view responses from their own forms" ON responses;
CREATE POLICY "Admins can view all responses"
ON responses
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Response answers: allow all admins to view all answers
DROP POLICY IF EXISTS "Admins can view answers from their own forms" ON response_answers;
CREATE POLICY "Admins can view all answers"
ON response_answers
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));