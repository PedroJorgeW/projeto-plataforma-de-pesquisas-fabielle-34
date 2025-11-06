import { useState, useEffect } from "react";
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
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface FormItem {
  id: string;
  type: 'theme' | 'question';
  ordem: number;
}

interface Theme extends FormItem {
  type: 'theme';
  title: string;
  description: string;
}

interface Question extends FormItem {
  type: 'question';
  text: string;
  questionType: string;
  isRequired: boolean;
  customOptions: string[];
  hasDiscursiveField: boolean;
}

interface CreateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormCreated: () => void;
}

export const CreateFormDialog = ({ isOpen, onOpenChange, onFormCreated }: CreateFormDialogProps) => {
  const STORAGE_KEY = 'create-form-draft';
  
  const [formType, setFormType] = useState<"standard" | "custom">("standard");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    endDate: ""
  });
  const [items, setItems] = useState<(Theme | Question)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar rascunho do localStorage quando o componente montar
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormType(draft.formType);
        setFormData(draft.formData);
        setItems(draft.items || []);
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      }
    }
  }, []);

  // Salvar rascunho no localStorage sempre que houver mudanças
  useEffect(() => {
    const draft = {
      formType,
      formData,
      items
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [formType, formData, items]);

  const addTheme = () => {
    const newTheme: Theme = {
      id: Date.now().toString(),
      type: 'theme',
      ordem: items.length,
      title: "",
      description: ""
    };
    setItems([...items, newTheme]);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'question',
      ordem: items.length,
      text: "",
      questionType: "text",
      isRequired: true,
      customOptions: formType === "custom" ? [""] : [],
      hasDiscursiveField: false
    };
    setItems([...items, newQuestion]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id).map((item, index) => ({ ...item, ordem: index })));
  };

  const moveItemUp = (id: string) => {
    const index = items.findIndex(item => item.id === id);
    if (index > 0) {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setItems(newItems.map((item, idx) => ({ ...item, ordem: idx })));
    }
  };

  const moveItemDown = (id: string) => {
    const index = items.findIndex(item => item.id === id);
    if (index < items.length - 1) {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setItems(newItems.map((item, idx) => ({ ...item, ordem: idx })));
    }
  };

  const updateTheme = (id: string, field: 'title' | 'description', value: string) => {
    setItems(items.map(item => 
      item.id === id && item.type === 'theme' ? { ...item, [field]: value } : item
    ));
  };

  const updateQuestion = (id: string, text: string) => {
    setItems(items.map(item => 
      item.id === id && item.type === 'question' ? { ...item, text } : item
    ));
  };

  const toggleRequired = (id: string) => {
    setItems(items.map(item => 
      item.id === id && item.type === 'question' ? { ...item, isRequired: !item.isRequired } : item
    ));
  };

  const addCustomOption = (questionId: string) => {
    setItems(items.map(item => 
      item.id === questionId && item.type === 'question' 
        ? { ...item, customOptions: [...item.customOptions, ""] } 
        : item
    ));
  };

  const updateCustomOption = (questionId: string, optionIndex: number, value: string) => {
    setItems(items.map(item => {
      if (item.id === questionId && item.type === 'question') {
        const newOptions = [...item.customOptions];
        newOptions[optionIndex] = value;
        return { ...item, customOptions: newOptions };
      }
      return item;
    }));
  };

  const removeCustomOption = (questionId: string, optionIndex: number) => {
    setItems(items.map(item => {
      if (item.id === questionId && item.type === 'question' && item.customOptions.length > 1) {
        return { ...item, customOptions: item.customOptions.filter((_, i) => i !== optionIndex) };
      }
      return item;
    }));
  };

  const toggleDiscursiveField = (questionId: string) => {
    setItems(items.map(item => 
      item.id === questionId && item.type === 'question' 
        ? { ...item, hasDiscursiveField: !item.hasDiscursiveField } 
        : item
    ));
  };

  const resetForm = () => {
    setFormType("standard");
    setFormData({
      title: "",
      description: "",
      endDate: ""
    });
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
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

    const questions = items.filter((item): item is Question => item.type === 'question');
    const themes = items.filter((item): item is Theme => item.type === 'theme');
    
    const validQuestions = questions.filter(q => q.questionType === 'discursive' || q.text.trim());
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

      // Validate custom form options
      if (formType === "custom") {
        for (const question of validQuestions) {
          if (question.questionType !== 'discursive') {
            const validOptions = question.customOptions.filter(opt => opt.trim());
            if (validOptions.length < 2) {
              toast({
                title: "Erro",
                description: "Cada pergunta personalizada deve ter pelo menos 2 opções de resposta.",
                variant: "destructive"
              });
              return;
            }
          }
        }
      }

      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          end_date: formData.endDate || null,
          status: 'ativo',
          admin_user_id: adminUser.id,
          form_type: formType
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

      // Criar temas se houver
      if (themes.length > 0) {
        const validThemes = themes.filter(t => t.title.trim());
        if (validThemes.length > 0) {
          const themesToInsert = validThemes.map(theme => ({
            form_id: form.id,
            title: theme.title.trim(),
            description: theme.description.trim() || null,
            ordem: theme.ordem + 1
          }));

          const { error: themesError } = await supabase
            .from('form_themes')
            .insert(themesToInsert);

          if (themesError) {
            console.error('Error creating themes:', themesError);
            await supabase.from('forms').delete().eq('id', form.id);
            toast({
              title: "Erro",
              description: `Falha ao criar temas: ${themesError.message}`,
              variant: "destructive"
            });
            return;
          }
        }
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
      const questionsToInsert = validQuestions.map(question => ({
        form_id: form.id,
        question_text: question.text.trim() || "[Resposta Discursiva]",
        question_type: question.questionType,
        ordem: question.ordem + 1,
        admin_user_id: adminUser.id,
        is_required: question.isRequired,
        custom_options: question.questionType === 'discursive' 
          ? null 
          : (formType === "custom" ? question.customOptions.filter(opt => opt.trim()) : null),
        has_discursive_field: question.hasDiscursiveField || false
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
              <CardTitle>Tipo de Formulário</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={formType} onValueChange={(value) => setFormType(value as "standard" | "custom")} disabled={isLoading}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                    <RadioGroupItem value="standard" id="standard" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="cursor-pointer font-medium">
                        Formulário Padrão
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usa respostas fixas: Muito Satisfeito, Satisfeito e Insatisfeito
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="custom" className="cursor-pointer font-medium">
                        Formulário Personalizado
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permite definir suas próprias opções de resposta para cada pergunta
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

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
                <CardTitle>Conteúdo do Formulário</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={addTheme} variant="outline" size="sm" disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tema
                  </Button>
                  <Button onClick={addQuestion} variant="outline" size="sm" disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Adicione temas e perguntas para criar seu formulário
                </p>
              )}
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3">
                  {item.type === 'theme' ? (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Tema</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItemUp(item.id)}
                              disabled={index === 0 || isLoading}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItemDown(item.id)}
                              disabled={index === items.length - 1 || isLoading}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          value={item.title}
                          onChange={(e) => updateTheme(item.id, 'title', e.target.value)}
                          placeholder="Título do Tema (ex: Liderança)"
                          disabled={isLoading}
                        />
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateTheme(item.id, 'description', e.target.value)}
                          placeholder="Descrição do tema..."
                          rows={2}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="default">Pergunta {items.filter(i => i.type === 'question').slice(0, items.filter(i => i.type === 'question').indexOf(item) + 1).length}</Badge>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`required-${item.id}`}
                                checked={item.isRequired}
                                onCheckedChange={() => toggleRequired(item.id)}
                                disabled={isLoading}
                              />
                              <Label htmlFor={`required-${item.id}`} className="text-sm font-normal cursor-pointer">
                                Obrigatória
                              </Label>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItemUp(item.id)}
                              disabled={index === 0 || isLoading}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveItemDown(item.id)}
                              disabled={index === items.length - 1 || isLoading}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {item.questionType === "discursive" ? (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground italic">
                              Campo de resposta discursiva - Os participantes poderão escrever livremente
                            </p>
                          </div>
                        ) : (
                          <Textarea
                            value={item.text}
                            onChange={(e) => updateQuestion(item.id, e.target.value)}
                            placeholder="Digite sua pergunta..."
                            rows={2}
                            disabled={isLoading}
                          />
                        )}

                        {formType === "custom" && item.questionType !== "discursive" && (
                          <div className="space-y-2 pl-4 border-l-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Opções de Resposta</Label>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => addCustomOption(item.id)}
                                  variant="ghost"
                                  size="sm"
                                  disabled={isLoading}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Opção
                                </Button>
                                <Button
                                  onClick={() => toggleDiscursiveField(item.id)}
                                  variant={item.hasDiscursiveField ? "default" : "ghost"}
                                  size="sm"
                                  disabled={isLoading}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {item.hasDiscursiveField ? "Remover Discursiva" : "Adicionar Discursiva"}
                                </Button>
                              </div>
                            </div>
                            {item.customOptions.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <Badge variant="outline" className="px-2">
                                  {optIndex + 1}
                                </Badge>
                                <Input
                                  value={option}
                                  onChange={(e) => updateCustomOption(item.id, optIndex, e.target.value)}
                                  placeholder={`Opção ${optIndex + 1}`}
                                  disabled={isLoading}
                                />
                                {item.customOptions.length > 1 && (
                                  <Button
                                    onClick={() => removeCustomOption(item.id, optIndex)}
                                    variant="ghost"
                                    size="sm"
                                    disabled={isLoading}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {item.hasDiscursiveField && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-md border border-dashed">
                                <p className="text-sm text-muted-foreground italic">
                                  ✏️ Campo de resposta discursiva incluído (os participantes poderão escrever livremente)
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {formType === "standard" && (
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
                    </div>
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
