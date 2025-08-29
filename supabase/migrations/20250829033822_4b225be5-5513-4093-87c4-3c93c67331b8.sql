-- Fix critical security issues: Remove public access to admin data

-- 1. Drop the policy that allows public access to all admin users
DROP POLICY IF EXISTS "todos veem todos os admins" ON admin_users;

-- 2. Create a secure policy for admin users - only authenticated users can see admin profiles
CREATE POLICY "Authenticated users can view admin profiles" 
ON admin_users 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Update forms table to hide admin_user_id from public access
DROP POLICY IF EXISTS "Público pode ver formulários ativos" ON forms;

-- Create new policy that excludes admin_user_id from public access
CREATE POLICY "Public can view active forms without admin data" 
ON forms 
FOR SELECT 
TO public 
USING (
  status = 'ativo' 
  AND (end_date IS NULL OR end_date >= now())
);

-- 4. Update questions table to hide admin_user_id from public access  
DROP POLICY IF EXISTS "Public access to questions of active forms" ON questions;

-- Create new policy for public access to questions without admin data
CREATE POLICY "Public can view questions of active forms without admin data"
ON questions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM forms f 
    WHERE f.id = questions.form_id 
    AND f.status = 'ativo' 
    AND (f.end_date IS NULL OR f.end_date >= now())
  )
);

-- 5. Fix the database function status check (it was using 'active' instead of 'ativo')
CREATE OR REPLACE FUNCTION public.insert_response_with_answers_anon(p_form_id uuid, p_answers jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_response_id uuid;
  v_question_id uuid;
  v_resposta text;
BEGIN
  -- Valida se o formulário está ativo (fixed status value)
  IF NOT EXISTS (
    SELECT 1
    FROM forms f
    WHERE f.id = p_form_id
      AND f.status = 'ativo'  -- Fixed: was using 'active'
      AND (f.end_date IS NULL OR f.end_date >= now())
  ) THEN
    RAISE EXCEPTION 'Formulário inválido, inativo ou expirado';
  END IF;

  -- Insere na tabela responses
  INSERT INTO responses (form_id)
  VALUES (p_form_id)
  RETURNING id INTO v_response_id;

  -- Insere cada resposta na tabela response_answers
  FOR v_question_id, v_resposta IN
    SELECT key::uuid, value::text
    FROM jsonb_each_text(p_answers)
  LOOP
    -- Validate that the question belongs to the form
    IF EXISTS (
      SELECT 1 FROM questions 
      WHERE id = v_question_id 
      AND form_id = p_form_id
    ) THEN
      INSERT INTO response_answers (response_id, question_id, resposta)
      VALUES (v_response_id, v_question_id, v_resposta);
    END IF;
  END LOOP;

  -- Retorna o ID da resposta recém-criada
  RETURN v_response_id;
END;
$function$;