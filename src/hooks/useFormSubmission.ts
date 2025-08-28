import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setupRLSPolicies } from "@/utils/setupRLSPolicies";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number | null;
}

interface UseFormSubmissionProps {
  formId: string;
  questions: Question[];
  onSuccess?: (responseId: string) => void;
  onError?: (error: any) => void;
}

export const useFormSubmission = ({
  formId,
  questions,
  onSuccess,
  onError
}: UseFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFormResponse = async (answers: Record<string, string>) => {
    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando envio de resposta do formulário (PUBLIC):', {
        formId,
        totalQuestions: questions.length,
        totalAnswers: Object.keys(answers).length,
        answers,
        questionsData: questions
      });

      // Validation checks
      if (!questions || questions.length === 0) {
        console.error('❌ ERRO: Nenhuma pergunta encontrada!', { questions });
        throw new Error('Nenhuma pergunta encontrada para este formulário');
      }

      if (!answers || Object.keys(answers).length === 0) {
        console.error('❌ ERRO: Nenhuma resposta fornecida!', { answers });
        throw new Error('Nenhuma resposta foi fornecida');
      }

      // Validar se todas as perguntas foram respondidas
      const missing = questions.filter(q => !answers[q.id]);
      if (missing.length > 0) {
        console.error('❌ ERRO: Existem perguntas sem resposta!', { missingQuestions: missing.map(q => ({ id: q.id, text: q.question_text })) });
        throw new Error('Por favor, responda todas as perguntas antes de enviar.');
      }

      // Validar formId atual do formulário
      if (!formId) {
        console.error('❌ ERRO: formId ausente ou inválido!', { formId });
        throw new Error('Formulário inválido. Recarregue a página e tente novamente.');
      }

      // Validar formId atual do formulário
      if (!formId) {
        console.error('❌ ERRO: formId ausente ou inválido!', { formId });
        throw new Error('Formulário inválido. Recarregue a página e tente novamente.');
      }

      // Chamada via RPC segura para inserir response e respostas
      console.log('📥 Enviando via RPC insert_response_with_answers_anon', {
        p_form_id: formId,
        p_answers: answers
      });

      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('insert_response_with_answers_anon', {
          p_form_id: formId,
          p_answers: answers
        });

      if (rpcError) {
        console.error('❌ ERRO na RPC insert_response_with_answers_anon:', rpcError);

        // Se o erro for relacionado a RLS, mostrar as políticas necessárias
        if (rpcError.message?.toLowerCase().includes('row-level security') || rpcError.message?.toLowerCase().includes('policy')) {
          console.log('🔒 ERRO DE POLÍTICA RLS DETECTADO!');
          console.log('Para corrigir, execute estes comandos SQL no Supabase SQL Editor:');
          const policies = setupRLSPolicies();
          policies.then(commands => {
            commands.forEach(cmd => console.log(`  ${cmd}`));
          });
        }

        throw new Error(`Erro ao enviar respostas: ${rpcError.message}`);
      }

      const payload: any = rpcData ?? {};
      const responseId = payload?.response_id ?? payload?.id ?? (Array.isArray(payload) ? payload[0]?.response_id ?? payload[0]?.id : undefined);
      console.log('✅ RPC concluída com sucesso. responseId:', responseId);

      console.log('🎉 Formulário enviado com sucesso!', {
        responseId,
        formId,
        totalAnswersSaved: Object.keys(answers).length
      });
      
      toast({
        title: "Pesquisa enviada com sucesso!",
        description: "Obrigado por participar da nossa pesquisa.",
      });

      onSuccess?.(String(responseId ?? ''));
      
    } catch (error) {
      console.error('💥 Erro durante o envio da pesquisa:', error);
      toast({
        title: "Erro ao enviar pesquisa",
        description: (error as any)?.message ?? "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
      
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitFormResponse,
    isSubmitting
  };
};