-- Simplificar políticas RLS: permitir que qualquer admin autenticado veja todos os dados
-- mas bloquear completamente usuários não-admin

-- Para a tabela forms: qualquer admin pode ver todos os formulários
DROP POLICY IF EXISTS "todos admins veem todos os forms" ON forms;
CREATE POLICY "Admins can view all forms"
ON forms
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Para a tabela questions: qualquer admin pode ver todas as perguntas
DROP POLICY IF EXISTS "todos admins veem todas as perguntas" ON questions;
CREATE POLICY "Admins can view all questions"
ON questions
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Para responses: apenas admins podem ver
-- (política já corrigida na migração anterior, mas garantindo)
DROP POLICY IF EXISTS "Admins can view all responses" ON responses;
CREATE POLICY "Admins can view all responses"
ON responses
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Para response_answers: apenas admins podem ver
-- (política já corrigida na migração anterior, mas garantindo)
DROP POLICY IF EXISTS "Admins can view all answers" ON response_answers;
CREATE POLICY "Admins can view all answers"
ON response_answers
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Remover políticas restritivas que bloqueiam acesso público (que são desnecessárias)
DROP POLICY IF EXISTS "Block all public access to forms" ON forms;
DROP POLICY IF EXISTS "Block all public access to questions" ON questions;