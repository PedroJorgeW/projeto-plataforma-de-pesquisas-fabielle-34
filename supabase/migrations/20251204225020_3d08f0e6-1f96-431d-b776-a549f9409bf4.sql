-- Drop and recreate the view with the discursive_placeholder column
DROP VIEW IF EXISTS public_form_questions;

CREATE VIEW public_form_questions AS
SELECT 
  q.id,
  q.form_id,
  q.question_text,
  q.question_type,
  q.ordem,
  q.is_required,
  q.custom_options,
  q.theme_id,
  q.has_discursive_field,
  q.discursive_placeholder
FROM questions q
JOIN forms f ON f.id = q.form_id
WHERE f.status = 'ativo' 
  AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE);