-- Priority 1: Fix Admin Data Exposure
-- Update admin_users policy to allow users to see only their own profile
DROP POLICY IF EXISTS "Authenticated users can view admin profiles" ON admin_users;

CREATE POLICY "Users can view only their own admin profile"
ON admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Priority 2: Implement Response Data Segregation
-- Update responses table policies to restrict access to form owners only
DROP POLICY IF EXISTS "Admins read all responses" ON responses;

CREATE POLICY "Admins can view responses from their own forms"
ON responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM forms f 
    WHERE f.id = responses.form_id 
    AND f.admin_user_id = auth.uid()
  )
);

-- Update response_answers table policies to restrict access to form owners only
DROP POLICY IF EXISTS "Admins read answers of own forms" ON response_answers;

CREATE POLICY "Admins can view answers from their own forms"
ON response_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM responses r
    JOIN forms f ON f.id = r.form_id
    WHERE r.id = response_answers.response_id
    AND f.admin_user_id = auth.uid()
  )
);

-- Create security definer function for safe admin role checking (if needed later)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;