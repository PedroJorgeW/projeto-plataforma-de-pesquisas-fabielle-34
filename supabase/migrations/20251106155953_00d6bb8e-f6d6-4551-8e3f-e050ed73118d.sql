-- Adicionar coluna para campo discursivo nas perguntas
ALTER TABLE questions 
ADD COLUMN has_discursive_field boolean DEFAULT false;