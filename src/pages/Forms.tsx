import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Calendar,
  Users,
  Loader2,
  ClipboardList,
  Download
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreateFormDialog } from "@/components/CreateFormDialog";
import { ViewFormDialog } from "@/components/ViewFormDialog";
import * as XLSX from 'xlsx';

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  end_date: string | null;
  created_at: string;
  admin_user_id: string;
  form_type?: string;
  _count?: {
    responses: number;
  };
}

const Forms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user, adminUser } = useAuth();
  const { toast } = useToast();

  const fetchForms = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          questions(id),
          responses(
            id,
            response_answers(id, question_id, resposta)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching forms:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar formulários.",
          variant: "destructive"
        });
      } else {
        const formsWithCount = (data as any[]).map((form: any) => {
          const validCount = (form.responses || []).filter((resp: any) => {
            const answers = resp.response_answers || [];
            return answers.some((a: any) => a && a.question_id && typeof a.resposta !== 'undefined' && String(a.resposta).trim() !== '');
          }).length;

          return {
            ...form,
            _count: { responses: validCount }
          };
        });
        setForms(formsWithCount);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar formulários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [user]);

  const handleDelete = async (id: string) => {
    console.log('🗑️ Iniciando exclusão do formulário:', id);
    console.log('👤 User atual:', user?.id);
    console.log('👤 Admin user atual:', adminUser?.id);
    
    try {
      // Verificar sessão e auth.uid() detalhadamente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      console.log('🔐 Estado de autenticação detalhado:', {
        session: {
          exists: !!session,
          userId: session?.user?.id,
          error: sessionError
        },
        currentUser: {
          exists: !!currentUser,
          userId: currentUser?.id,
          error: authError
        },
        contextUser: user?.id,
        contextAdminUser: adminUser?.id
      });
      
      if (sessionError || !session) {
        console.error('❌ Erro de sessão:', sessionError);
        toast({
          title: "Erro de Autenticação",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔐 Sessão válida para usuário:', session.user.id);

      // Delete in the correct order: responses -> questions -> form
      // Delete responses first
      console.log('📊 Deletando respostas...');
      const { error: responsesError } = await supabase
        .from('responses')
        .delete()
        .eq('form_id', id);

      if (responsesError) {
        console.error('❌ Erro ao deletar respostas:', responsesError);
        toast({
          title: "Erro",
          description: `Falha ao excluir respostas: ${responsesError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Delete questions
      console.log('❓ Deletando perguntas...');
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('form_id', id);

      if (questionsError) {
        console.error('❌ Erro ao deletar perguntas:', questionsError);
        toast({
          title: "Erro",
          description: `Falha ao excluir perguntas: ${questionsError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Finally delete the form
      console.log('📋 Deletando formulário...');
      console.log('🔐 Auth context - User ID:', user?.id);
      console.log('👤 Admin User ID:', adminUser?.id);
      
      const { error: formError, data: deletedForms, count } = await supabase
        .from('forms')
        .delete()
        .eq('id', id)
        .select('*');

      console.log('📋 Resultado delete formulário:');
      console.log('  - Error:', formError);
      console.log('  - Data:', deletedForms);
      console.log('  - Count:', count);

      if (formError) {
        console.error('❌ Erro ao deletar formulário:', formError);
        toast({
          title: "Erro",
          description: `Falha ao excluir formulário: ${formError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!deletedForms || deletedForms.length === 0) {
        console.log('⚠️ Nenhum formulário foi deletado - possível problema RLS');
        
        // Check RLS policies by trying to fetch the form first
        console.log('🔍 Testando se conseguimos ver o formulário...');
        const { data: canSeeForm, error: seeError } = await supabase
          .from('forms')
          .select('id, title, admin_user_id')
          .eq('id', id)
          .single();
          
        console.log('👀 Conseguimos ver o formulário?', canSeeForm, seeError);
        
        toast({
          title: "Erro",
          description: "Não foi possível excluir o formulário. Problema com políticas RLS.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Formulário excluído com sucesso:', deletedForms[0]);
      toast({
        title: "Formulário excluído",
        description: "O formulário foi excluído com sucesso.",
      });
      
      await fetchForms();
      
    } catch (error) {
      console.error('💥 Erro interno na exclusão:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ativo' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border';
  };

  const getStatusText = (status: string, endDate: string | null) => {
    if (status === 'inativo') return 'Inativo';
    if (endDate && new Date(endDate) < new Date()) return 'Expirado';
    return 'Ativo';
  };

  const handleDownloadAllResponses = async () => {
    try {
      toast({
        title: "Gerando arquivo",
        description: "Aguarde enquanto preparamos os dados...",
      });

      // Buscar todos os formulários com suas respostas e temas
      const { data: allForms, error: formsError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          form_type,
          form_themes(
            id,
            title,
            ordem
          ),
          questions(
            id,
            question_text,
            question_type,
            custom_options,
            ordem
          ),
          responses(
            id,
            response_answers(
              question_id,
              resposta
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      // Processar dados para agregação
      const aggregatedData: any[] = [];

      allForms?.forEach((form: any) => {
        const formId = form.id;
        const formTitle = form.title;
        const formType = form.form_type === 'custom' ? 'Personalizado' : 'Padrão';

        // Ordenar temas por ordem
        const sortedThemes = (form.form_themes || []).sort((a: any, b: any) => a.ordem - b.ordem);

        // Função para determinar o tema de uma pergunta baseado na ordem
        // Perguntas herdam o tema que vem ANTES delas (menor ordem)
        // Continua com o mesmo tema até aparecer um novo tema
        // Só fica "Sem tema" se nenhum tema antecede a pergunta
        const getThemeForQuestion = (questionOrdem: number): string => {
          let currentTheme = 'Sem tema';
          for (const theme of sortedThemes) {
            if (theme.ordem < questionOrdem) {
              currentTheme = theme.title;
            }
            // Não usa break - continua para encontrar o último tema antes da pergunta
          }
          return currentTheme;
        };

        // Agrupar respostas por pergunta e resposta
        const responseMap = new Map<string, Map<string, number>>();
        const questionThemeMap = new Map<string, string>();

        form.questions?.forEach((question: any) => {
          const questionKey = `${question.id}|${question.question_text}`;
          responseMap.set(questionKey, new Map());
          
          // Determinar tema baseado na ordem
          const themeName = getThemeForQuestion(question.ordem || 0);
          questionThemeMap.set(questionKey, themeName);
        });

        form.responses?.forEach((response: any) => {
          response.response_answers?.forEach((answer: any) => {
            const question = form.questions?.find((q: any) => q.id === answer.question_id);
            if (question) {
              const questionKey = `${question.id}|${question.question_text}`;
              const answerText = answer.resposta || '';
              
              const answersMap = responseMap.get(questionKey);
              if (answersMap) {
                answersMap.set(answerText, (answersMap.get(answerText) || 0) + 1);
              }
            }
          });
        });

        // Converter para formato de linhas do Excel
        responseMap.forEach((answersMap, questionKey) => {
          const [, questionText] = questionKey.split('|');
          const themeName = questionThemeMap.get(questionKey) || 'Sem tema';
          
          answersMap.forEach((count, answerText) => {
            aggregatedData.push({
              'ID do Formulário': formId,
              'Nome do Formulário': formTitle,
              'Tipo de Formulário': formType,
              'Tema': themeName,
              'Pergunta': questionText,
              'Resposta': answerText,
              'Contagem de Respostas': count
            });
          });
        });
      });

      if (aggregatedData.length === 0) {
        toast({
          title: "Sem dados",
          description: "Não há respostas para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Criar planilha Excel
      const worksheet = XLSX.utils.json_to_sheet(aggregatedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas Agregadas');

      // Ajustar largura das colunas
      const maxWidth = 50;
      const colWidths = [
        { wch: 36 }, // ID do Formulário
        { wch: 30 }, // Nome do Formulário
        { wch: 20 }, // Tipo de Formulário
        { wch: 25 }, // Tema
        { wch: maxWidth }, // Pergunta
        { wch: 30 }, // Resposta
        { wch: 20 }  // Contagem
      ];
      worksheet['!cols'] = colWidths;

      // Baixar arquivo
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `respostas_formularios_${timestamp}.xlsx`);

      toast({
        title: "Download concluído",
        description: "O arquivo foi baixado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar o arquivo Excel.",
        variant: "destructive"
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Formulários</h1>
          <p className="text-muted-foreground">Gerencie seus formulários de pesquisa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadAllResponses}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Respostas
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Formulário
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Formulários</CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum formulário encontrado. Crie seu primeiro formulário!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Formulário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell>
                      <Badge variant={form.form_type === "custom" ? "default" : "secondary"}>
                        {form.form_type === "custom" ? "Personalizado" : "Padrão"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {form.description || "Sem descrição"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(form.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {form._count?.responses || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(form.status)}>
                        {getStatusText(form.status, form.end_date)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/forms/${form.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Editar formulário">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <ViewFormDialog formId={form.id}>
                          <Button variant="ghost" size="sm" title="Visualizar formulário">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewFormDialog>
                        <Link 
                          to={`/pesquisa/${form.id}`} 
                          target="_blank"
                          onClick={() => console.log('🔗 Abrindo formulário público com ID:', form.id)}
                        >
                          <Button variant="ghost" size="sm" title="Abrir formulário público">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Excluir formulário">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir formulário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita e todas as perguntas e respostas associadas também serão excluídas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(form.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateFormDialog 
        isOpen={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onFormCreated={fetchForms}
      />
    </div>
  );
};

export default Forms;
