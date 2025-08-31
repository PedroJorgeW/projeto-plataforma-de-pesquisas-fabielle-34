-- Fix the admin_user_id exposure by updating existing policies and creating safe public views

-- 1. Remove any existing public policies that might expose admin data
DROP POLICY IF EXISTS "Public can view active forms without admin data" ON public.forms;
DROP POLICY IF EXISTS "Public can view questions of active forms without admin data" ON public.questions;
DROP POLICY IF EXISTS "No public direct access to forms table" ON public.forms;
DROP POLICY IF EXISTS "No public direct access to questions table" ON public.questions;

-- 2. Create completely restrictive policies for public access to original tables
CREATE POLICY "Block all public access to forms"
ON public.forms
FOR ALL
TO public
USING (false);

CREATE POLICY "Block all public access to questions"  
ON public.questions
FOR ALL
TO public
USING (false);

-- 3. Create safe public views that exclude admin_user_id completely
CREATE OR REPLACE VIEW public.public_active_forms AS
SELECT 
  id,
  title,
  description,
  end_date,
  created_at
FROM public.forms
WHERE status = 'ativo' 
  AND (end_date IS NULL OR end_date >= now());

CREATE OR REPLACE VIEW public.public_form_questions AS
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

-- 4. Set security properties on views
ALTER VIEW public.public_active_forms SET (security_invoker = true);
ALTER VIEW public.public_active_forms SET (security_barrier = true);
ALTER VIEW public.public_form_questions SET (security_invoker = true);
ALTER VIEW public.public_form_questions SET (security_barrier = true);

-- 5. Grant SELECT to public on safe views only
GRANT SELECT ON public.public_active_forms TO public;
GRANT SELECT ON public.public_form_questions TO public;