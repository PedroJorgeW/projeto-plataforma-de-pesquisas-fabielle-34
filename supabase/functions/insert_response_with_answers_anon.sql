-- Função RPC para inserir respostas de formulário de forma anônima
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION insert_response_with_answers_anon(
  p_form_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response_id UUID;
  v_question_id TEXT;
  v_answer TEXT;
  v_result JSONB;
BEGIN
  -- Validar se o formulário existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM forms 
    WHERE id = p_form_id 
    AND status = 'active' 
    AND (end_date IS NULL OR end_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Formulário não encontrado ou inativo';
  END IF;

  -- Inserir novo response
  INSERT INTO responses (form_id, created_at)
  VALUES (p_form_id, NOW())
  RETURNING id INTO v_response_id;

  -- Inserir todas as respostas do JSON
  FOR v_question_id, v_answer IN 
    SELECT key, value 
    FROM jsonb_each_text(p_answers)
  LOOP
    -- Validar se a pergunta existe
    IF EXISTS (SELECT 1 FROM questions WHERE id = v_question_id::UUID AND form_id = p_form_id) THEN
      INSERT INTO response_answers (response_id, question_id, resposta, created_at)
      VALUES (v_response_id, v_question_id::UUID, v_answer, NOW());
    END IF;
  END LOOP;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'response_id', v_response_id,
    'message', 'Respostas inseridas com sucesso'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao inserir respostas: %', SQLERRM;
END;
$$;

-- Permitir acesso anônimo à função
GRANT EXECUTE ON FUNCTION insert_response_with_answers_anon TO anon;