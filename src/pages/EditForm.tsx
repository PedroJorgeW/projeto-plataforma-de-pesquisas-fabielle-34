import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number | null;
  form_id: string;
  is_required: boolean;
  custom_options: string[] | null;
  theme_id?: string | null;
  isNew?: boolean;
  has_discursive_field?: boolean;
}

interface Theme {
  id: string;
  title: string;
  description: string | null;
  ordem: number;
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
    end_date: "",
    form_type: "standard" as "standard" | "custom"
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
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

      // Load themes
      const { data: themesData, error: themesError } = await supabase
        .from('form_themes')
        .select('*')
        .eq('form_id', id)
        .order('ordem', { ascending: true });

      if (themesError) {
        console.error('Error loading themes:', themesError);
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
        end_date: formData.end_date || "",
        form_type: ((formData as any).form_type || "standard") as "standard" | "custom"
      };

      setFormData(loadedFormData);
      
      // Map themes
      const mappedThemes: Theme[] = (themesData || []).map((t: any) => ({
        ...t
      }));
      setThemes(mappedThemes);
      
      // Map questions to include new fields with defaults
      const mappedQuestions: Question[] = Array.isArray(questionsData) ? questionsData.map((q: any) => ({
        ...q,
        is_required: q.is_required ?? true,
        custom_options: Array.isArray(q.custom_options) ? q.custom_options : null,
        has_discursive_field: q.has_discursive_field ?? false
      })) : [];
      
      setQuestions(mappedQuestions);
      
      // Store original data for comparison
      setOriginalData({
        form: loadedFormData,
        themes: themesData || [],
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

  const addTheme = () => {
    const newTheme: Theme = {
      id: `new_theme_${Date.now()}`,
      title: "",
      description: null,
      ordem: themes.length + questions.length + 1,
      form_id: id!,
      isNew: true
    };
    setThemes([...themes, newTheme]);
  };

  const removeTheme = (themeId: string) => {
    setThemes(themes.filter(t => t.id !== themeId));
  };

  const updateTheme = (themeId: string, field: 'title' | 'description', value: string) => {
    setThemes(themes.map(t => 
      t.id === themeId ? { ...t, [field]: value } : t
    ));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `new_${Date.now()}`,
      question_text: "",
      question_type: "likert",
      ordem: themes.length + questions.length + 1,
      form_id: id!,
      is_required: true,
      custom_options: formData.form_type === "custom" ? [""] : null,
      isNew: true,
      has_discursive_field: false
    };
    setQuestions([...questions, newQuestion]);
  };

  const addDiscursiveQuestion = () => {
    const newQuestion: Question = {
      id: `new_${Date.now()}`,
      question_text: "[Pergunta discursiva]",
      question_type: "text",
      ordem: themes.length + questions.length + 1,
      form_id: id!,
      is_required: false,
      custom_options: null,
      isNew: true,
      has_discursive_field: false
    };
    setQuestions([...questions, newQuestion]);
  };

  const toggleDiscursiveField = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, has_discursive_field: !q.has_discursive_field } : q
    ));
  };

  const updateQuestionType = (questionId: string, type: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question_type: type } : q
    ));
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

  const toggleRequired = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, is_required: !q.is_required } : q
    ));
  };

  const addCustomOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const currentOptions = q.custom_options || [];
        return { ...q, custom_options: [...currentOptions, ""] };
      }
      return q;
    }));
  };

  const updateCustomOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.custom_options) {
        const newOptions = [...q.custom_options];
        newOptions[optionIndex] = value;
        return { ...q, custom_options: newOptions };
      }
      return q;
    }));
  };

  const removeCustomOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.custom_options && q.custom_options.length > 1) {
        return { ...q, custom_options: q.custom_options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
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

      // Handle themes updates
      const existingThemes = themes.filter(t => !t.isNew);
      const newThemes = themes.filter(t => t.isNew);

      // Delete themes that were removed
      const originalThemeIds = originalData?.themes?.map((t: Theme) => t.id) || [];
      const currentThemeIds = existingThemes.map(t => t.id);
      const deletedThemeIds = originalThemeIds.filter((id: string) => !currentThemeIds.includes(id));

      if (deletedThemeIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('form_themes')
          .delete()
          .in('id', deletedThemeIds);

        if (deleteError) {
          console.error('Error deleting themes:', deleteError);
        }
      }

      // Update existing themes
      for (const theme of existingThemes) {
        if (theme.title.trim()) {
          const { error: updateError } = await supabase
            .from('form_themes')
            .update({
              title: theme.title.trim(),
              description: theme.description?.trim() || null,
              ordem: themes.indexOf(theme) + 1
            })
            .eq('id', theme.id);

          if (updateError) {
            console.error('Error updating theme:', updateError);
          }
        }
      }

      // Insert new themes
      if (newThemes.length > 0) {
        const themesToInsert = newThemes
          .filter(t => t.title.trim())
          .map((theme, index) => ({
            form_id: id!,
            title: theme.title.trim(),
            description: theme.description?.trim() || null,
            ordem: existingThemes.length + index + 1
          }));

        if (themesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('form_themes')
            .insert(themesToInsert);

          if (insertError) {
            console.error('Error inserting themes:', insertError);
          }
        }
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
          const isLikert = question.question_type === 'likert';
          const cleanedOptions = isLikert && formData.form_type === "custom" && Array.isArray(question.custom_options)
            ? question.custom_options.filter(opt => opt.trim())
            : null;

          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question_text: question.question_text.trim(),
              question_type: isLikert ? 'likert' : 'text',
              ordem: questions.indexOf(question) + 1,
              is_required: question.is_required,
              custom_options: cleanedOptions,
              has_discursive_field: isLikert ? (question.has_discursive_field || false) : false
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
          .map((question, index) => {
            const isLikert = question.question_type === 'likert';
            const cleanedOptions = isLikert && formData.form_type === "custom" && Array.isArray(question.custom_options)
              ? question.custom_options.filter(opt => opt.trim())
              : null;

            return {
              form_id: id!,
              question_text: question.question_text.trim(),
              question_type: isLikert ? 'likert' : 'text',
              ordem: existingQuestions.length + index + 1,
              admin_user_id: user?.id || '',
              is_required: question.is_required,
              custom_options: cleanedOptions,
              has_discursive_field: isLikert ? (question.has_discursive_field || false) : false
            };
          });

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
          <div className="flex items-center justify-between">
            <CardTitle>Informações Básicas</CardTitle>
            <Badge variant={formData.form_type === "custom" ? "default" : "secondary"}>
              {formData.form_type === "custom" ? "Formulário Personalizado" : "Formulário Padrão"}
            </Badge>
          </div>
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
            <CardTitle>Temas</CardTitle>
            <Button onClick={addTheme} variant="outline" size="sm" disabled={isSaving}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tema
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {themes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tema cadastrado. Os temas são opcionais.
            </div>
          ) : (
            themes.map((theme, index) => (
              <div key={theme.id} className="p-4 border rounded-lg space-y-3 bg-accent/20">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`theme-title-${theme.id}`}>
                        Tema {index + 1}
                        {theme.isNew && <span className="text-green-600 ml-1">(Novo)</span>}
                      </Label>
                    </div>
                    <Input
                      id={`theme-title-${theme.id}`}
                      value={theme.title}
                      onChange={(e) => updateTheme(theme.id, 'title', e.target.value)}
                      placeholder="Título do tema..."
                      disabled={isSaving}
                    />
                    <Textarea
                      id={`theme-desc-${theme.id}`}
                      value={theme.description || ""}
                      onChange={(e) => updateTheme(theme.id, 'description', e.target.value)}
                      placeholder="Descrição do tema (opcional)..."
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>
                  <Button
                    onClick={() => removeTheme(theme.id)}
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
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
              <div key={question.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`question-${question.id}`}>
                        Pergunta {index + 1}
                        {question.isNew && <span className="text-green-600 ml-1">(Nova)</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`required-${question.id}`}
                          checked={question.is_required}
                          onCheckedChange={() => toggleRequired(question.id)}
                          disabled={isSaving}
                        />
                        <Label htmlFor={`required-${question.id}`} className="text-sm font-normal cursor-pointer">
                          Obrigatória
                        </Label>
                      </div>
                    </div>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, e.target.value)}
                      placeholder="Digite sua pergunta..."
                      rows={2}
                      disabled={isSaving}
                    />

                    {formData.form_type === "custom" && (
                      <div>
                        <Label htmlFor={`type-${question.id}`} className="text-sm">
                          Tipo de Resposta
                        </Label>
                        <Select 
                          value={question.question_type} 
                          onValueChange={(value) => updateQuestionType(question.id, value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger id={`type-${question.id}`} className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="likert">Múltipla Escolha</SelectItem>
                            <SelectItem value="text">Texto Livre (Discursiva)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.form_type === "custom" && question.question_type !== "discursive" && question.question_type !== "text" && question.custom_options && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Opções de Resposta</Label>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => addCustomOption(question.id)}
                              variant="ghost"
                              size="sm"
                              disabled={isSaving}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar Opção
                            </Button>
                            <Button
                              onClick={() => toggleDiscursiveField(question.id)}
                              variant={question.has_discursive_field ? "default" : "ghost"}
                              size="sm"
                              disabled={isSaving}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {question.has_discursive_field ? "Remover Discursiva" : "Adicionar Discursiva"}
                            </Button>
                          </div>
                        </div>
                        {Array.isArray(question.custom_options) && question.custom_options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Badge variant="outline" className="px-2">
                              {optIndex + 1}
                            </Badge>
                            <Input
                              value={option}
                              onChange={(e) => updateCustomOption(question.id, optIndex, e.target.value)}
                              placeholder={`Opção ${optIndex + 1}`}
                              disabled={isSaving}
                            />
                            {question.custom_options && question.custom_options.length > 1 && (
                              <Button
                                onClick={() => removeCustomOption(question.id, optIndex)}
                                variant="ghost"
                                size="sm"
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {question.has_discursive_field && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md border border-dashed">
                            <p className="text-sm text-muted-foreground italic">
                              ✏️ Campo de resposta discursiva incluído (os participantes poderão escrever livremente)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.form_type === "standard" && (
                      <div className="text-sm text-muted-foreground pl-4 border-l-2">
                        <p className="font-medium mb-1">Opções de Resposta (fixas):</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Muito Satisfeito</li>
                          <li>Satisfeito</li>
                          <li>Insatisfeito</li>
                        </ul>
                      </div>
                    )}
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