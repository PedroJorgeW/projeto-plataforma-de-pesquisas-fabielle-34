import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  text: string;
  type: string;
}

interface CreateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormCreated: () => void;
}

export const CreateFormDialog = ({ isOpen, onOpenChange, onFormCreated }: CreateFormDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    endDate: ""
  });
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", type: "text" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "text"
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, text } : q
    ));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      endDate: ""
    });
    setQuestions([{ id: "1", text: "", type: "text" }]);
  };

  const handleSave = async () => {
    console.log('🔄 Iniciando criação do formulário...');
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O nome do formulário é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const validQuestions = questions.filter(q => q.text.trim());
    console.log('📝 Perguntas válidas:', validQuestions);
    
    if (validQuestions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma pergunta válida.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verificar sessão atual e auth.uid()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔑 Sessão atual:', {
        session: session?.user?.id,
        sessionError,
        userFromContext: user.id
      });

      console.log('👤 Buscando usuário admin para:', user.id);
      
      // Get admin user id
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Resultado admin user:', { adminUser, adminError });

      if (adminError || !adminUser) {
        console.error('Error getting admin user:', adminError);
        toast({
          title: "Erro",
          description: "Falha ao verificar usuário administrador.",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 Criando formulário com dados:', {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        end_date: formData.endDate || null,
        status: 'ativo',
        admin_user_id: adminUser.id
      });

      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          end_date: formData.endDate || null,
          status: 'ativo',
          admin_user_id: adminUser.id
        })
        .select()
        .single();

      console.log('📋 Resultado criação formulário:', { form, formError });

      if (formError) {
        console.error('Error creating form:', formError);
        toast({
          title: "Erro",
          description: `Falha ao criar formulário: ${formError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('❓ Preparando perguntas para inserir:', validQuestions);
      console.log('👤 User ID:', user.id);
      console.log('👤 Admin User ID:', adminUser.id);
      console.log('📋 Form ID:', form.id);
      
      // Verificar auth.uid() novamente antes de inserir perguntas
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth atual antes das perguntas:', {
        currentUser: currentUser?.id,
        authError,
        contextUser: user.id,
        adminUserId: adminUser.id
      });
      
      // Create questions
      const questionsToInsert = validQuestions.map((question, index) => ({
        form_id: form.id,
        question_text: question.text.trim(),
        question_type: question.type,
        ordem: index + 1,
        admin_user_id: adminUser.id
      }));

      console.log('❓ Perguntas para inserir (estrutura completa):', JSON.stringify(questionsToInsert, null, 2));
      console.log('❓ Total de perguntas:', questionsToInsert.length);
      console.log('❓ Valor do admin_user_id sendo enviado:', adminUser.id, typeof adminUser.id);

      const { error: questionsError, data: questionsData } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();

      console.log('❓ Resultado criação perguntas:', { 
        questionsData, 
        questionsError: questionsError ? {
          message: questionsError.message,
          code: questionsError.code,
          details: questionsError.details,
          hint: questionsError.hint
        } : null
      });

      if (questionsError) {
        console.error('🚨 ERRO DETALHADO AO CRIAR PERGUNTAS:', questionsError);
        console.error('🚨 Código do erro:', questionsError.code);
        console.error('🚨 Detalhes do erro:', questionsError.details);
        console.error('🚨 Dica do erro:', questionsError.hint);
        
        // Try to delete the form if questions failed
        console.log('🗑️ Deletando formulário devido ao erro nas perguntas...');
        await supabase.from('forms').delete().eq('id', form.id);
        
        let errorMessage = `Falha ao criar perguntas: ${questionsError.message}`;
        
        // Check if it's an RLS error
        if (questionsError.message.includes('row-level security') || questionsError.code === '42501') {
          errorMessage = 'Erro de permissão: As políticas de segurança do banco de dados estão bloqueando a criação de perguntas. Entre em contato com o administrador do sistema.';
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Formulário e perguntas criados com sucesso!');
      
      toast({
        title: "Sucesso",
        description: "Formulário criado com sucesso!",
      });

      resetForm();
      onOpenChange(false);
      onFormCreated();
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Formulário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Nome do Formulário *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Pesquisa de Clima Organizacional"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo da pesquisa..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Encerramento</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Perguntas</CardTitle>
                <Button onClick={addQuestion} variant="outline" size="sm" disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor={`question-${question.id}`}>
                      Pergunta {index + 1}
                    </Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, e.target.value)}
                      placeholder="Digite sua pergunta..."
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button
                      onClick={() => removeQuestion(question.id)}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Criar Formulário"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};