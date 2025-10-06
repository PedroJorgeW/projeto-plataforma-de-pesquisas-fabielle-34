import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { BarChart, Users, TrendingUp, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  end_date: string | null;
  created_at: string;
  questions: Question[];
  responses: Response[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number; // Database field name
  opcoes?: any[]; // Optional database field for options
}

interface Response {
  id: string;
  form_id: string;
  created_at: string;
  response_answers: ResponseAnswer[];
}

interface ResponseAnswer {
  id: string;
  response_id: string;
  question_id: string;
  resposta: string;
  created_at: string;
}

interface QuestionResult {
  question: string;
  responses: {
    option: string;
    count: number;
    percentage: number;
  }[];
}

interface FormResults {
  totalResponses: number;
  data: {
    name: string;
    value: number;
    percentage: number;
  }[];
  questions: QuestionResult[];
}

const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--destructive))'];

// Helper to get color based on satisfaction level
const getSatisfactionColor = (option: string) => {
  const optionLower = option.toLowerCase();
  if (optionLower.includes('muito') && optionLower.includes('satisfeito')) {
    return 'hsl(var(--very-satisfied))'; // Verde
  } else if (optionLower.includes('satisfeito') && !optionLower.includes('muito') && !optionLower.includes('insatisfeito')) {
    return 'hsl(var(--satisfied))'; // Azul
  } else if (optionLower.includes('insatisfeito')) {
    return 'hsl(var(--unsatisfied))'; // Vermelho
  }
  return 'hsl(var(--primary))'; // Azul para formulários personalizados
};

// Helper to format option labels (e.g., "muito_satisfeito" -> "Muito satisfeito")
const formatOptionLabel = (value: string) => {
  if (!value) return 'Sem resposta';
  const clean = value.replace(/_/g, ' ').trim();
  return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const Results = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [formResults, setFormResults] = useState<FormResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFormsAndResults = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Buscar todos os formulários ativos (padrão e personalizado)
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          questions(*)
        `)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (formsError) {
        console.error('Error fetching forms:', formsError);
        toast({
          title: "Erro",
          description: "Falha ao carregar formulários.",
          variant: "destructive"
        });
        return;
      }

      // Para cada formulário, buscar suas respostas
      const formsWithResponses = await Promise.all(
        (formsData || []).map(async (form) => {
          // Buscar responses deste formulário
          const { data: responsesData, error: responsesError } = await supabase
            .from('responses')
            .select(`
              *,
              response_answers(*)
            `)
            .eq('form_id', form.id);

          if (responsesError) {
            console.error('Error fetching responses for form:', form.id, responsesError);
            return { ...form, questions: form.questions || [], responses: [] };
          }

          console.log(`📊 Respostas encontradas para formulário ${form.title}:`, responsesData);

          return {
            ...form,
            questions: form.questions || [],
            responses: responsesData || []
          };
        })
      );

      setForms(formsWithResponses as Form[]);
      
      // Selecionar o primeiro formulário automaticamente se houver
      if (formsData && formsData.length > 0 && !selectedForm) {
        setSelectedForm(formsData[0].id);
      }

    } catch (error) {
      console.error('Error fetching forms and results:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processFormResults = (form: Form): FormResults => {
    const questionsCount = form.questions.length;

    // Considerar todas as respostas válidas (com pelo menos uma resposta)
    const validResponses = form.responses.filter((response: any) => {
      const answers = response.response_answers || [];
      // Uma resposta é válida se tiver pelo menos uma answer
      return answers.length > 0 && answers.some((a: any) => 
        a && a.question_id && typeof a.resposta !== 'undefined' && String(a.resposta).trim() !== ''
      );
    });

    const totalResponses = validResponses.length;
    
    console.log(`🔍 Processando resultados para ${form.title}:`, {
      totalRespostas: form.responses.length,
      respostasValidas: totalResponses,
      questionsCount,
      responses: validResponses
    });
    
    if (totalResponses === 0) {
      return {
        totalResponses: 0,
        data: [],
        questions: []
      };
    }

    // Processar resultados por pergunta usando apenas respostas completas
    const questionResults: QuestionResult[] = form.questions
      .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
      .map((question: any) => {
        // Para cada pergunta, coletar respostas dos participantes válidos
        const questionAnswers: any[] = [];
        validResponses.forEach((response: any) => {
          if (response.response_answers) {
            const answer = response.response_answers.find(
              (a: any) => a.question_id === question.id && typeof a.resposta !== 'undefined' && String(a.resposta).trim() !== ''
            );
            if (answer) questionAnswers.push(answer);
          }
        });

        console.log(`📝 Pergunta "${question.question_text}" - ${questionAnswers.length} respostas:`, questionAnswers);
        
        // Processar multiple_choice (usa question.opcoes ou question.custom_options)
        const options = question.opcoes || (question as any).custom_options;
        if (question.question_type === 'multiple_choice' && options) {
          const optionCounts: { [key: string]: number } = {};
          
          // Inicializar contadores
          options.forEach((option: string) => {
            optionCounts[option] = 0;
          });
          
          // Contar respostas
          questionAnswers.forEach((answer: any) => {
            try {
              // Tentar parsear como JSON (caso seja array) ou usar diretamente
              let selectedOptions = answer.resposta;
              if (typeof selectedOptions === 'string') {
                try {
                  selectedOptions = JSON.parse(selectedOptions);
                } catch {
                  // Se não for JSON, usar como string simples
                  selectedOptions = [selectedOptions];
                }
              }
              
              if (Array.isArray(selectedOptions)) {
                selectedOptions.forEach((option: string) => {
                  if (optionCounts.hasOwnProperty(option)) {
                    optionCounts[option]++;
                  }
                });
              } else if (typeof selectedOptions === 'string' && optionCounts.hasOwnProperty(selectedOptions)) {
                optionCounts[selectedOptions]++;
              }
            } catch (error) {
              console.error('Erro ao processar resposta:', answer, error);
            }
          });
          
          const matchedResponses = Object.entries(optionCounts).map(([option, count]) => ({
            option,
            count,
            percentage: questionAnswers.length > 0 ? Math.round((count / questionAnswers.length) * 100) : 0
          }));
          
          // Garantir que o total conte todas as respostas, mesmo as que não batem com as opções
          const matchedTotal = matchedResponses.reduce((sum, r) => sum + r.count, 0);
          const unmatched = Math.max(0, questionAnswers.length - matchedTotal);
          const responses = unmatched > 0
            ? [
                ...matchedResponses,
                {
                  option: 'Outros',
                  count: unmatched,
                  percentage: questionAnswers.length > 0 ? Math.round((unmatched / questionAnswers.length) * 100) : 0
                }
              ]
            : matchedResponses;
          
          return {
            question: question.question_text,
            responses
          };
        }
        
        // Para outros tipos de pergunta, agrupar por resposta de texto
        const textResponses: { [key: string]: number } = {};
        questionAnswers.forEach((answer: any) => {
          const text = answer.resposta || 'Sem resposta';
          textResponses[text] = (textResponses[text] || 0) + 1;
        });
        
        const responses = Object.entries(textResponses).map(([text, count]) => ({
          option: text,
          count,
          percentage: questionAnswers.length > 0 ? Math.round((count / questionAnswers.length) * 100) : 0
        }));
        
        return {
          question: question.question_text,
          responses
        };
      });

    // Calcular distribuição geral agregando respostas de todas as perguntas
    let generalData: { name: string; value: number; percentage: number; }[] = [];

    if (questionResults.length > 0) {
      const aggregate: Record<string, number> = {};
      questionResults.forEach(q => {
        q.responses.forEach(r => {
          const key = (r.option || 'Sem resposta').toString().toLowerCase();
          aggregate[key] = (aggregate[key] || 0) + r.count;
        });
      });

      const total = Object.values(aggregate).reduce((a, b) => a + b, 0);
      generalData = Object.entries(aggregate).map(([key, count]) => ({
        name: formatOptionLabel(key),
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    }

    return {
      totalResponses,
      data: generalData,
      questions: questionResults
    };
  };

  useEffect(() => {
    fetchFormsAndResults();
  }, [user]);

  useEffect(() => {
    if (selectedForm && forms.length > 0) {
      const form = forms.find(f => f.id === selectedForm);
      if (form) {
        const results = processFormResults(form);
        setFormResults(results);
        setSelectedQuestion(0); // Reset to first question
      }
    }
  }, [selectedForm, forms]);

  const exportResults = () => {
    if (!formResults || !selectedForm) {
      toast({
        title: "Erro",
        description: "Nenhum formulário selecionado para exportar.",
        variant: "destructive"
      });
      return;
    }

    const selectedFormData = forms.find(f => f.id === selectedForm);
    if (!selectedFormData) return;

    // Criar dados para o Excel
    const workbook = XLSX.utils.book_new();
    
    // Aba 1: Resumo geral
    const summaryData = [
      ['Relatório de Resultados'],
      ['Formulário:', selectedFormData.title],
      ['Descrição:', selectedFormData.description || 'N/A'],
      ['Total de Participantes:', formResults.totalResponses],
      ['Data de Geração:', new Date().toLocaleString('pt-BR')],
      [],
      ['Distribuição Geral de Respostas'],
      ['Opção', 'Quantidade', 'Porcentagem'],
      ...formResults.data.map(item => [item.name, item.value, item.percentage + '%'])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
    
    // Aba 2: Detalhes por pergunta
    const detailsData = [
      ['Resultados Detalhados por Pergunta'],
      []
    ];
    
    formResults.questions.forEach((question, index) => {
      detailsData.push([`Pergunta ${index + 1}:`, question.question]);
      detailsData.push(['Opção', 'Quantidade', 'Porcentagem']);
      question.responses.forEach(response => {
        detailsData.push([
          formatOptionLabel(response.option),
          response.count.toString(),
          response.percentage + '%'
        ]);
      });
      detailsData.push([]); // Linha em branco entre perguntas
    });
    
    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalhes');
    
    // Gerar e baixar o arquivo
    const fileName = `resultados_${selectedFormData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Exportação concluída",
      description: "Os resultados foram exportados com sucesso.",
    });
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resultados</h1>
        <p className="text-muted-foreground">Visualize os dados coletados das pesquisas</p>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">Selecionar formulário:</label>
        <Select value={selectedForm} onValueChange={setSelectedForm}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um formulário" />
          </SelectTrigger>
          <SelectContent>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum formulário encontrado.</p>
              <p className="text-sm">Crie formulários para visualizar resultados.</p>
            </div>
          </CardContent>
        </Card>
      ) : !selectedForm ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um formulário para visualizar os resultados.</p>
            </div>
          </CardContent>
        </Card>
      ) : !formResults ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : formResults.totalResponses === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Este formulário ainda não possui respostas.</p>
              <p className="text-sm">Compartilhe o link do formulário para coletar dados.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-foreground">
                    {formResults.totalResponses}
                  </div>
                  <Users className="h-6 w-6 text-primary" />
                </div>
                 <p className="text-xs text-muted-foreground mt-1">
                   {formResults.questions.reduce((total, q) => total + q.responses.reduce((sum, r) => sum + r.count, 0), 0)} respostas válidas
                 </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Muito Satisfeito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-success">
                    {formResults.data.length > 0 ? 
                      (formResults.data.find(d => d.name.toLowerCase().includes('muito satisfeito'))?.percentage || 0) + "%" 
                      : "N/A"
                    }
                  </div>
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Perguntas Analisadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {formResults.questions.length}
                  </div>
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Chart */}
          {formResults.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geral de Respostas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsBarChart data={formResults.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number, name: string, props: any) => {
                      const total = formResults.data.reduce((sum, item) => sum + item.value, 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      return [`${value} (${percentage}%)`, 'Respostas'];
                    }} />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                       {formResults.data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={getSatisfactionColor(entry.name)} />
                       ))}
                     </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results by Question */}
          {formResults.questions.length > 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Resultados por Pergunta</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Pergunta {selectedQuestion + 1} de {formResults.questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestion((q) => Math.max(0, q - 1))}
                        disabled={selectedQuestion === 0}
                      >
                        Anterior
                      </Button>
                      <span className="text-lg font-semibold text-foreground">
                        {selectedQuestion + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestion((q) => Math.min(formResults.questions.length - 1, q + 1))}
                        disabled={selectedQuestion === formResults.questions.length - 1}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>{formResults.questions.length}</span>
                    </div>
                    <Slider
                      value={[selectedQuestion + 1]}
                      onValueChange={(value) => setSelectedQuestion(value[0] - 1)}
                      max={formResults.questions.length}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {formResults.questions[selectedQuestion] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Pergunta {selectedQuestion + 1}: {formResults.questions[selectedQuestion].question}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formResults.questions[selectedQuestion].responses.reduce((sum, r) => sum + r.count, 0)} resposta(s) coletada(s)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {formResults.questions[selectedQuestion].responses.map((response, responseIndex) => (
                          <div key={responseIndex} className="flex justify-between items-center p-3 border border-border rounded-lg">
                            <span className="font-medium">{formatOptionLabel(response.option)}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold">{response.count}</span>
                              <span className="text-sm text-muted-foreground">({response.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsBarChart data={formResults.questions[selectedQuestion].responses}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="option" tickFormatter={formatOptionLabel} />
                          <YAxis />
                          <Tooltip formatter={(value: number, name: string, props: any) => {
                            const questionData = formResults.questions[selectedQuestion];
                            const response = questionData.responses.find(r => r.count === value);
                            const percentage = response ? response.percentage : 0;
                            return [`${value} (${percentage}%)`, 'Respostas'];
                          }} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {formResults.questions[selectedQuestion].responses.map((entry, responseIndex) => (
                              <Cell key={`cell-${responseIndex}`} fill={getSatisfactionColor(entry.option)} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Results;