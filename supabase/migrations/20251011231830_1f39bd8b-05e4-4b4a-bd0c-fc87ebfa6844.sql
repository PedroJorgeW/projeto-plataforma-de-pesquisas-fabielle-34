-- Criar tabela de temas dos formulários
CREATE TABLE IF NOT EXISTS public.form_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.form_themes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para form_themes
CREATE POLICY "Admins can view all themes"
  ON public.form_themes
  FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert themes"
  ON public.form_themes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update themes"
  ON public.form_themes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete themes"
  ON public.form_themes
  FOR DELETE
  USING (true);

CREATE POLICY "Public can view themes of active forms"
  ON public.form_themes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_themes.form_id
        AND f.status = 'ativo'
        AND (f.end_date IS NULL OR f.end_date >= CURRENT_DATE)
    )
  );

-- Adicionar campo theme_id na tabela questions
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.form_themes(id) ON DELETE SET NULL;