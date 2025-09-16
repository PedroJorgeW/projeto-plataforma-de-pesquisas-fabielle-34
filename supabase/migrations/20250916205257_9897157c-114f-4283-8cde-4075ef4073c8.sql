-- Fix public access to forms and questions
-- Create secure views for public access to active forms and their questions

-- First, ensure the public can read active forms directly from the forms table
-- Update the existing public access policy to be more permissive for debugging
DROP POLICY IF EXISTS "Allow public read access to active forms" ON forms;
CREATE POLICY "Allow public read access to active forms" ON forms 
FOR SELECT 
TO public 
USING (status = 'ativo' AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Ensure the public can read questions for active forms
DROP POLICY IF EXISTS "Allow public read access to questions of active forms" ON questions;
CREATE POLICY "Allow public read access to questions of active forms" ON questions 
FOR SELECT 
TO public 
USING (EXISTS (
  SELECT 1 FROM forms f 
  WHERE f.id = questions.form_id 
  AND f.status = 'ativo' 
  AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE)
));

-- Create or update public_active_forms view
DROP VIEW IF EXISTS public_active_forms;
CREATE VIEW public_active_forms AS 
SELECT id, title, description, end_date, created_at
FROM forms 
WHERE status = 'ativo' 
AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- Create or update public_form_questions view  
DROP VIEW IF EXISTS public_form_questions;
CREATE VIEW public_form_questions AS
SELECT q.id, q.form_id, q.question_text, q.question_type, q.ordem
FROM questions q
JOIN forms f ON f.id = q.form_id
WHERE f.status = 'ativo' 
AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE);

-- Create public_forms view (general forms view)
DROP VIEW IF EXISTS public_forms;
CREATE VIEW public_forms AS
SELECT id, title, description, end_date, created_at
FROM forms
WHERE status = 'ativo'
AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- Create public_questions view (general questions view)
DROP VIEW IF EXISTS public_questions;
CREATE VIEW public_questions AS  
SELECT q.id, q.form_id, q.question_text, q.question_type, q.ordem
FROM questions q
JOIN forms f ON f.id = q.form_id
WHERE f.status = 'ativo'
AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE);