-- Fix SECURITY DEFINER views by recreating them without SECURITY DEFINER
-- Drop and recreate all views without SECURITY DEFINER

-- Drop all existing views first
DROP VIEW IF EXISTS public.view_active_forms CASCADE;
DROP VIEW IF EXISTS public.view_form_summary CASCADE;
DROP VIEW IF EXISTS public.view_question_summary CASCADE;
DROP VIEW IF EXISTS public.view_responses_export CASCADE;

-- Recreate views without SECURITY DEFINER (they will use SECURITY INVOKER by default)

-- 1. View for active forms (public access)
CREATE VIEW public.view_active_forms AS
SELECT 
  id,
  title,
  end_date
FROM forms f 
WHERE status = 'ativo' 
  AND (end_date IS NULL OR end_date >= now());

-- 2. View for form summary (authenticated access only)
CREATE VIEW public.view_form_summary AS
SELECT 
  f.id AS form_id,
  f.title AS form_title,
  q.id AS question_id,
  q.question_text,
  ra.resposta,
  COUNT(*) AS total_respostas
FROM forms f
JOIN questions q ON q.form_id = f.id
LEFT JOIN response_answers ra ON ra.question_id = q.id
GROUP BY f.id, f.title, q.id, q.question_text, ra.resposta
ORDER BY f.id, q.id, ra.resposta;

-- 3. View for question summary (authenticated access only)
CREATE VIEW public.view_question_summary AS
SELECT 
  q.form_id,
  q.id AS question_id,
  q.question_text,
  ra.resposta,
  COUNT(*) AS total_respostas
FROM questions q
LEFT JOIN response_answers ra ON ra.question_id = q.id
GROUP BY q.form_id, q.id, q.question_text, ra.resposta
ORDER BY q.form_id, q.id, ra.resposta;

-- 4. View for responses export (authenticated access only)
CREATE VIEW public.view_responses_export AS
SELECT 
  r.id AS response_id,
  r.form_id,
  q.id AS question_id,
  q.question_text,
  ra.resposta,
  r.created_at AS response_date
FROM responses r
JOIN response_answers ra ON ra.response_id = r.id
JOIN questions q ON q.id = ra.question_id;