-- Add column for discursive field placeholder text
ALTER TABLE public.questions 
ADD COLUMN discursive_placeholder text DEFAULT 'Digite sua resposta aqui...';