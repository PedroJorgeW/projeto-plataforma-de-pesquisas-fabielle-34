-- Remove public access to admin_user_id fields in forms and questions tables
-- Create public-safe views and update RLS policies

-- 1. First, remove the existing public SELECT policies that might expose admin data
DROP POLICY IF EXISTS "Public can view active forms without admin data" ON public.forms;
DROP POLICY IF EXISTS "Public can view questions of active forms without admin data" ON public.questions;

-- 2. Create restricted views for public access that completely exclude admin fields
CREATE OR REPLACE VIEW public.public_forms AS
SELECT 
  id,
  title,
  description,
  status,
  end_date,
  created_at
FROM public.forms
WHERE status = 'ativo' 
  AND (end_date IS NULL OR end_date >= now());

CREATE OR REPLACE VIEW public.public_questions AS
SELECT 
  q.id,
  q.form_id,
  q.question_text,
  q.question_type,
  q.ordem,
  q.created_at
FROM public.questions q
JOIN public.forms f ON f.id = q.form_id
WHERE f.status = 'ativo' 
  AND (f.end_date IS NULL OR f.end_date >= now());

-- 3. Set views to use caller permissions and be security barriers
ALTER VIEW public.public_forms SET (security_invoker = true);
ALTER VIEW public.public_forms SET (security_barrier = true);
ALTER VIEW public.public_questions SET (security_invoker = true);
ALTER VIEW public.public_questions SET (security_barrier = true);

-- 4. Create new restrictive policies for the original tables (no public access to admin fields)
-- Forms: Public access denied to protect admin_user_id
CREATE POLICY "No public direct access to forms table"
ON public.forms
FOR SELECT
TO public
USING (false);

-- Questions: Public access denied to protect admin_user_id  
CREATE POLICY "No public direct access to questions table"
ON public.questions
FOR SELECT
TO public
USING (false);

-- 5. Ensure authenticated admins still have full access
-- (These policies already exist, just confirming they work)
-- Forms: "todos admins veem todos os forms" 
-- Questions: "todos admins veem todas as perguntas"

-- 6. Grant public access to the safe views only
GRANT SELECT ON public.public_forms TO public;
GRANT SELECT ON public.public_questions TO public;