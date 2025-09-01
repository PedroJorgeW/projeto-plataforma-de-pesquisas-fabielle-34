-- Fix security vulnerability: Recreate view_responses_export as a security definer function
-- Since we can't apply RLS directly to views, we'll recreate this as a secure function

-- First drop the existing view
DROP VIEW IF EXISTS view_responses_export;

-- Create a security definer function that only admins can access
CREATE OR REPLACE FUNCTION public.get_responses_export()
RETURNS TABLE (
    response_id uuid,
    form_id uuid,
    question_id uuid,
    question_text text,
    resposta text,
    response_date timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Only allow admin users to access this data
    SELECT 
        r.id AS response_id,
        r.form_id,
        q.id AS question_id,
        q.question_text,
        ra.resposta,
        r.created_at AS response_date
    FROM responses r
    JOIN response_answers ra ON ra.response_id = r.id
    JOIN questions q ON q.id = ra.question_id
    WHERE public.is_admin_user(auth.uid());
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_responses_export() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_responses_export() FROM anon;