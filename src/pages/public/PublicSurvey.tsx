import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import ThemePage from "@/components/ThemePage";

interface Form {
  id: string;
  title: string;
  description: string | null;
  end_date: string | null;
  created_at: string;
  form_type?: string;
}

interface Theme {
  id: string;
  title: string;
  description: string | null;
  ordem: number;
}

interface OptionItem {
  type: 'choice' | 'discursive';
  value: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number | null;
  is_required?: boolean;
  custom_options?: OptionItem[] | null;
  theme_id?: string | null;
  has_discursive_field?: boolean;
  discursive_placeholder?: string | null;
}

const responseOptions = [
  { value: "muito_satisfeito", label: "Muito Satisfeito" },
  { value: "satisfeito", label: "Satisfeito" },
  { value: "insatisfeito", label: "Insatisfeito" },
];

const PublicSurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Form | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentThemeIndex, setCurrentThemeIndex] = useState<number | null>(null);

  const { submitFormResponse, isSubmitting } = useFormSubmission({
    formId: form?.id || "",
    questions,
    onSuccess: () => navigate("/obrigado"),
    onError: (error) => console.error('Form submission error:', error)
  });

  useEffect(() => {
    if (id) {
      fetchFormData();
    }
  }, [id]);

  const fetchFormData = async () => {
    try {
      console.log('🔍 Buscando formulário com ID:', id);
      
      // Fetch form details using public-safe view
      const { data: formData, error: formError } = await supabase
        .from('public_active_forms')
        .select('*')
        .eq('id', id)
        .single();

      console.log('📋 Resultado busca formulário:', { formData, formError });

      if (formError) {
        console.error('❌ Error fetching form:', formError);
        setForm(null);
        setIsLoading(false);
        return;
      }

      // Fetch themes using public-safe view
      const { data: themesData, error: themesError } = await supabase
        .from('public_form_themes')
        .select('*')
        .eq('form_id', id)
        .order('ordem', { ascending: true });

      if (themesError) {
        console.error('Error fetching themes:', themesError);
        setThemes([]);
      } else {
        setThemes(themesData || []);
      }

      // Fetch questions using public-safe view
      const { data: questionsData, error: questionsError } = await supabase
        .from('public_form_questions')
        .select('*')
        .eq('form_id', id)
        .order('ordem', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        setQuestions([]);
      } else {
        const mappedQuestions: Question[] = (questionsData || []).map((q: any) => {
          let customOptions: OptionItem[] | null = null;
          
          if (Array.isArray(q.custom_options) && q.custom_options.length > 0) {
            // Check if it's new format (array of objects with type/value)
            if (typeof q.custom_options[0] === 'object' && 'type' in q.custom_options[0]) {
              customOptions = q.custom_options as OptionItem[];
            } else {
              // Old format - array of strings, migrate
              customOptions = q.custom_options.map((opt: string) => ({
                type: 'choice' as const,
                value: opt
              }));
              // Add discursive if it existed
              if (q.has_discursive_field) {
                customOptions.push({
                  type: 'discursive' as const,
                  value: q.discursive_placeholder || "Digite sua resposta aqui..."
                });
              }
            }
          }

          return {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            ordem: q.ordem ?? null,
            is_required: q.is_required,
            theme_id: q.theme_id,
            has_discursive_field: q.has_discursive_field ?? false,
            discursive_placeholder: q.discursive_placeholder,
            custom_options: customOptions
          };
        });
        console.log('📋 Perguntas carregadas:', mappedQuestions);
        setQuestions(mappedQuestions);
      }

      setForm(formData);
    } catch (error) {
      console.error('Error fetching form data:', error);
      setForm(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando pesquisa...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Pesquisa não encontrada</h2>
            <p className="text-muted-foreground">
              Esta pesquisa não existe ou foi removida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Note: Since we're using public_active_forms view, the form is already active
  // and within date range - no need to check status or expiration


  if (questions.length === 0 && themes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Nenhum conteúdo encontrado</h2>
            <p className="text-muted-foreground">
              Esta pesquisa ainda não possui temas ou perguntas cadastradas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnswerChange = (value: string) => {
    if (!currentQuestionId) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: value
    }));
  };

  // Criar estrutura de navegação combinando temas e perguntas por ordem
  const navigationItems: Array<{ type: 'theme', data: Theme, ordem: number } | { type: 'question', data: Question, ordem: number }> = [];
  
  themes.forEach(theme => {
    navigationItems.push({ type: 'theme', data: theme, ordem: theme.ordem });
  });
  
  questions.forEach(q => {
    navigationItems.push({ type: 'question', data: q, ordem: (q.ordem ?? 999999) });
  });
  
  // Ordenar por ordem
  navigationItems.sort((a, b) => a.ordem - b.ordem);

  const handleNext = () => {
    const currentItem = navigationItems[currentQuestion];
    
    // Se estamos em um tema, apenas avança
    if (currentItem?.type === 'theme') {
      if (currentQuestion < navigationItems.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
      return;
    }

    // Se é uma pergunta, validar
    if (currentItem?.type === 'question') {
      const currentQ = currentItem.data;
      const qId = currentQ?.id;
      
      if (qId && currentQ?.is_required !== false && !answers[qId]) {
        toast({
          title: "Resposta obrigatória",
          description: "Por favor, selecione uma resposta para continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentQuestion < navigationItems.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form?.id) {
      toast({
        title: "Formulário inválido",
        description: "Não foi possível identificar o formulário atual.",
        variant: "destructive",
      });
      return;
    }

    // Validação final: apenas perguntas obrigatórias devem estar respondidas
    const missing = questions.filter(q => q.is_required !== false && !answers[q.id]);
    if (missing.length > 0) {
      const firstMissingQuestionId = missing[0].id;
      const navIndex = navigationItems.findIndex(
        (i) => i.type === 'question' && i.data.id === firstMissingQuestionId
      );
      if (navIndex >= 0) setCurrentQuestion(navIndex);
      toast({
        title: "Respostas obrigatórias",
        description: "Responda todas as perguntas obrigatórias antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    // Combinar respostas de múltipla escolha com discursivas
    const processedAnswers: Record<string, string> = {};
    questions.forEach(q => {
      const mainAnswer = answers[q.id];
      
      // Check for discursive answer in new format (indexed discursive fields)
      let discursiveAnswer = "";
      Object.keys(answers).forEach(key => {
        if (key.startsWith(`${q.id}_discursive_`) && answers[key]) {
          discursiveAnswer = answers[key];
        }
      });
      // Also check old format
      if (!discursiveAnswer && answers[`${q.id}_discursive`]) {
        discursiveAnswer = answers[`${q.id}_discursive`];
      }
      
      if (mainAnswer || discursiveAnswer) {
        let combinedAnswer = mainAnswer || "";
        if (discursiveAnswer && discursiveAnswer.trim()) {
          combinedAnswer = mainAnswer 
            ? `${mainAnswer} | Comentário: ${discursiveAnswer.trim()}`
            : discursiveAnswer.trim();
        }
        processedAnswers[q.id] = combinedAnswer;
      }
    });

    await submitFormResponse(processedAnswers);
  };

  const progress = ((currentQuestion + 1) / navigationItems.length) * 100;
  const isLastItem = currentQuestion === navigationItems.length - 1;
  const currentItem = navigationItems[currentQuestion];
  const currentQuestionData = currentItem?.type === 'question' ? currentItem.data : null;
  const currentThemeData = currentItem?.type === 'theme' ? currentItem.data : null;
  const currentQuestionId = currentQuestionData?.id;
  
  const totalQuestions = questions.length;
  const currentQuestionNumber = currentQuestionData ? questions.findIndex(q => q.id === currentQuestionId) + 1 : 0;
  
  // Check if we have the new format options
  const hasNewFormatOptions = form?.form_type === "custom" && 
    currentQuestionData?.custom_options && 
    currentQuestionData.custom_options.length > 0;

  // Se o item atual é um tema, renderizar a página de tema
  if (currentThemeData) {
    return (
      <div className="min-h-screen bg-background">
        <ThemePage 
          title={currentThemeData.title} 
          description={currentThemeData.description || ""} 
        />
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto max-w-2xl flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
            <Button onClick={handleNext}>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render option based on type
  const renderOption = (option: OptionItem, idx: number, activeDiscursiveIdx: number | null) => {
    if (option.type === 'discursive') {
      const discursiveKey = `${currentQuestionId}_discursive_${idx}`;
      const isThisDiscursiveActive = activeDiscursiveIdx === idx;
      
      return (
        <div 
          key={`discursive-${idx}`}
          className={`flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors ${isThisDiscursiveActive ? 'border-primary bg-primary/10' : 'border-border'}`}
        >
          <Textarea
            value={answers[discursiveKey] || ""}
            onChange={(e) => {
              const newAnswers = { ...answers };
              // Clear any previous answer
              newAnswers[currentQuestionId || ""] = "";
              delete newAnswers[`${currentQuestionId}_active_discursive`];
              // Clear other discursive fields for this question
              Object.keys(newAnswers).forEach(key => {
                if (key.startsWith(`${currentQuestionId}_discursive_`) && key !== discursiveKey) {
                  delete newAnswers[key];
                }
              });
              // Set value for this specific discursive field
              newAnswers[discursiveKey] = e.target.value;
              if (e.target.value) {
                newAnswers[`${currentQuestionId}_active_discursive`] = String(idx);
              }
              setAnswers(newAnswers);
            }}
            onFocus={() => {
              const newAnswers = { ...answers };
              // Clear choice selection
              newAnswers[currentQuestionId || ""] = "";
              // Clear other discursive fields
              Object.keys(newAnswers).forEach(key => {
                if (key.startsWith(`${currentQuestionId}_discursive_`) && key !== discursiveKey) {
                  delete newAnswers[key];
                }
              });
              newAnswers[`${currentQuestionId}_active_discursive`] = String(idx);
              setAnswers(newAnswers);
            }}
            placeholder={option.value || "Digite sua resposta aqui..."}
            rows={1}
            className="w-full min-h-0 py-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
          />
        </div>
      );
    }

    // Choice option
    const isSelected = activeDiscursiveIdx === null && answers[currentQuestionId || ""] === option.value;
    
    return (
      <div 
        key={`${option.value}-${idx}`}
        className={`flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <RadioGroupItem value={option.value} id={`${option.value}-${idx}`} />
        <Label 
          htmlFor={`${option.value}-${idx}`}
          className={`cursor-pointer font-medium ${isSelected ? 'text-primary' : ''}`}
        >
          {option.value}
        </Label>
      </div>
    );
  };

  // Se chegou aqui, é uma pergunta
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <img 
            src="/lovable-uploads/94c9c571-47aa-423f-b803-13621c9b9547.png" 
            alt="Performance to Be Logo" 
            className="h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-muted-foreground">
              {form.description}
            </p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pergunta {currentQuestionNumber} de {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {currentQuestionData ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {currentQuestionData?.question_text}
                </CardTitle>
                {currentQuestionData?.is_required === false && (
                  <Badge variant="outline" className="ml-2">Opcional</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestionData.question_type === 'text' ? (
                <div className="space-y-2">
                  <Textarea
                    value={answers[currentQuestionId || ""] || ""}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    rows={6}
                    className="w-full"
                  />
                </div>
              ) : hasNewFormatOptions ? (
                // New format: render options in order (mixed choice and discursive)
                <RadioGroup
                  value={answers[`${currentQuestionId}_active_discursive`] ? "" : (answers[currentQuestionId || ""] || "")}
                  onValueChange={(value) => {
                    const newAnswers = { ...answers };
                    newAnswers[currentQuestionId || ""] = value;
                    // Clear all discursive fields for this question
                    delete newAnswers[`${currentQuestionId}_active_discursive`];
                    Object.keys(newAnswers).forEach(key => {
                      if (key.startsWith(`${currentQuestionId}_discursive_`)) {
                        delete newAnswers[key];
                      }
                    });
                    setAnswers(newAnswers);
                  }}
                >
                  {currentQuestionData.custom_options!.map((option, idx) => {
                    const activeDiscursiveIdx = answers[`${currentQuestionId}_active_discursive`] !== undefined 
                      ? parseInt(answers[`${currentQuestionId}_active_discursive`]) 
                      : null;
                    return renderOption(option, idx, activeDiscursiveIdx);
                  })}
                </RadioGroup>
              ) : (
                // Standard form: fixed options
                <>
                  <RadioGroup
                    value={currentQuestionData.has_discursive_field && answers[`${currentQuestionId}_is_discursive`] === "true" ? "" : (answers[currentQuestionId || ""] || "")}
                    onValueChange={(value) => {
                      const newAnswers = { ...answers };
                      newAnswers[currentQuestionId || ""] = value;
                      // Clear discursive mode when selecting an option
                      if (currentQuestionData.has_discursive_field) {
                        delete newAnswers[`${currentQuestionId}_is_discursive`];
                      }
                      setAnswers(newAnswers);
                    }}
                  >
                    {responseOptions.map((option, idx) => {
                      const isDiscursiveMode = currentQuestionData.has_discursive_field && answers[`${currentQuestionId}_is_discursive`] === "true";
                      const isSelected = !isDiscursiveMode && answers[currentQuestionId || ""] === option.value;
                      
                      // Apply color coding for standard forms
                      let borderClass = 'border-border';
                      let bgClass = '';
                      let textClass = '';
                      
                      if (isSelected) {
                        if (option.value === 'muito_satisfeito') {
                          borderClass = 'border-very-satisfied';
                          bgClass = 'bg-very-satisfied/10';
                          textClass = 'text-very-satisfied';
                        } else if (option.value === 'satisfeito') {
                          borderClass = 'border-satisfied';
                          bgClass = 'bg-satisfied/10';
                          textClass = 'text-satisfied';
                        } else if (option.value === 'insatisfeito') {
                          borderClass = 'border-unsatisfied';
                          bgClass = 'bg-unsatisfied/10';
                          textClass = 'text-unsatisfied';
                        }
                      }
                      
                      return (
                        <div 
                          key={`${option.value}-${idx}`}
                          className={`flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors ${borderClass} ${bgClass}`}
                        >
                          <RadioGroupItem value={option.value} id={`${option.value}-${idx}`} />
                          <Label 
                            htmlFor={`${option.value}-${idx}`}
                            className={`cursor-pointer font-medium ${textClass}`}
                          >
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                  
                  {/* Discursive alternative for standard form with discursive field */}
                  {currentQuestionData.has_discursive_field && (
                    <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors border-border">
                      <Textarea
                        value={answers[`${currentQuestionId}_is_discursive`] === "true" ? (answers[currentQuestionId || ""] || "") : ""}
                        onChange={(e) => {
                          const newAnswers = { ...answers };
                          newAnswers[currentQuestionId || ""] = e.target.value;
                          newAnswers[`${currentQuestionId}_is_discursive`] = "true";
                          setAnswers(newAnswers);
                        }}
                        onFocus={() => {
                          // When focusing the textarea, switch to discursive mode
                          const newAnswers = { ...answers };
                          newAnswers[`${currentQuestionId}_is_discursive`] = "true";
                          newAnswers[currentQuestionId || ""] = "";
                          setAnswers(newAnswers);
                        }}
                        placeholder={currentQuestionData.discursive_placeholder || "Digite sua resposta aqui..."}
                        rows={1}
                        className="w-full min-h-0 py-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isLastItem ? "Enviar Respostas" : "Próxima"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default PublicSurvey;
