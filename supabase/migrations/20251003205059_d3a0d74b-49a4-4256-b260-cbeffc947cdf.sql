-- Drop and recreate public_active_forms view with form_type
DROP VIEW IF EXISTS public_active_forms;

CREATE VIEW public_active_forms AS
SELECT 
  id, 
  created_at, 
  title, 
  description, 
  end_date,
  form_type
FROM forms
WHERE status = 'ativo' 
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- Drop and recreate public_form_questions view with is_required and custom_options
DROP VIEW IF EXISTS public_form_questions;

CREATE VIEW public_form_questions AS
SELECT 
  q.id,
  q.form_id,
  q.question_text,
  q.question_type,
  q.ordem,
  q.is_required,
  q.custom_options
FROM questions q
INNER JOIN forms f ON f.id = q.form_id
WHERE f.status = 'ativo' 
  AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE);