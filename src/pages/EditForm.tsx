import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number | null;
  form_id: string;
  isNew?: boolean;
}

const EditForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    end_date: ""
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadFormData();
    }
  }, [id]);

  const loadFormData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Load form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single();

      if (formError) {
        console.error('Error loading form:', formError);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados do formulário.",
          variant: "destructive"
        });
        navigate('/admin/forms');
        return;
      }

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', id)
        .order('ordem', { ascending: true });

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        toast({
          title: "Erro",
          description: "Falha ao carregar perguntas do formulário.",
          variant: "destructive"
        });
        return;
      }

      const loadedFormData = {
        title: formData.title,
        description: formData.description || "",
        status: formData.status,
        end_date: formData.end_date || ""
      };

      setFormData(loadedFormData);
      setQuestions(questionsData || []);
      
      // Store original data for comparison
      setOriginalData({
        form: loadedFormData,
        questions: questionsData || []
      });

    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
      navigate('/admin/forms');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `new_${Date.now()}`,
      question_text: "",
      question_type: "text",
      ordem: questions.length + 1,
      form_id: id!,
      isNew: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question_text: text } : q
    ));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O nome do formulário é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma pergunta válida.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update form data
      const { error: formError } = await supabase
        .from('forms')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          end_date: formData.end_date || null
        })
        .eq('id', id);

      if (formError) {
        console.error('Error updating form:', formError);
        toast({
          title: "Erro",
          description: "Falha ao atualizar formulário.",
          variant: "destructive"
        });
        return;
      }

      // Handle questions updates
      const existingQuestions = questions.filter(q => !q.isNew);
      const newQuestions = questions.filter(q => q.isNew);

      // Delete questions that were removed
      const originalQuestionIds = originalData?.questions?.map((q: Question) => q.id) || [];
      const currentQuestionIds = existingQuestions.map(q => q.id);
      const deletedQuestionIds = originalQuestionIds.filter((id: string) => !currentQuestionIds.includes(id));

      if (deletedQuestionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .in('id', deletedQuestionIds);

        if (deleteError) {
          console.error('Error deleting questions:', deleteError);
        }
      }

      // Update existing questions
      for (const question of existingQuestions) {
        if (question.question_text.trim()) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question_text: question.question_text.trim(),
              question_type: question.question_type,
              ordem: questions.indexOf(question) + 1
            })
            .eq('id', question.id);

          if (updateError) {
            console.error('Error updating question:', updateError);
          }
        }
      }

      // Insert new questions
      if (newQuestions.length > 0) {
        const questionsToInsert = newQuestions
          .filter(q => q.question_text.trim())
          .map((question, index) => ({
            form_id: id!,
            question_text: question.question_text.trim(),
            question_type: question.question_type,
            ordem: existingQuestions.length + index + 1,
            admin_user_id: user?.id || ''
          }));

        if (questionsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

          if (insertError) {
            console.error('Error inserting questions:', insertError);
            toast({
              title: "Erro",
              description: "Falha ao adicionar novas perguntas.",
              variant: "destructive"
            });
            return;
          }
        }
      }

      toast({
        title: "Formulário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      navigate("/admin/forms");
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/forms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Formulário</h1>
          <p className="text-muted-foreground">Edite as informações e perguntas do formulário</p>
        </div>
      </div>

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
              placeholder="Nome do formulário"
              disabled={isSaving}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do formulário"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger disabled={isSaving}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="endDate">Data de Encerramento</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Perguntas</CardTitle>
            <Button onClick={addQuestion} variant="outline" size="sm" disabled={isSaving}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pergunta cadastrada. Clique em "Adicionar Pergunta" para começar.
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`question-${question.id}`}>
                    Pergunta {index + 1}
                    {question.isNew && <span className="text-green-600 ml-1">(Nova)</span>}
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    placeholder="Digite sua pergunta..."
                    rows={2}
                    disabled={isSaving}
                  />
                </div>
                {questions.length > 1 && (
                  <Button
                    onClick={() => removeQuestion(question.id)}
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Link to="/admin/forms">
          <Button variant="outline" disabled={isSaving}>Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditForm;