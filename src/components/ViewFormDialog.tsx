import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  end_date: string | null;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  ordem: number | null;
}

interface ViewFormDialogProps {
  formId: string;
  children: React.ReactNode;
}

export const ViewFormDialog = ({ formId, children }: ViewFormDialogProps) => {
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchFormData = async () => {
    setIsLoading(true);
    try {
      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) {
        console.error('Error fetching form:', formError);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados do formulário.",
          variant: "destructive"
        });
        return;
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('ordem', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        toast({
          title: "Erro",
          description: "Falha ao carregar perguntas do formulário.",
          variant: "destructive"
        });
        return;
      }

      setForm(formData);
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
    }
  }, [isOpen, formId]);

  const getStatusColor = (status: string) => {
    return status === 'ativo' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border';
  };

  const getStatusText = (status: string, endDate: string | null) => {
    if (status === 'inativo') return 'Inativo';
    if (endDate && new Date(endDate) < new Date()) return 'Expirado';
    return 'Ativo';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Formulário</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : form ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{form.title}</span>
                  <Badge className={getStatusColor(form.status)}>
                    {getStatusText(form.status, form.end_date)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.description && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Descrição
                    </h4>
                    <p className="text-muted-foreground">{form.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Criação
                    </h4>
                    <p className="text-muted-foreground">
                      {new Date(form.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  {form.end_date && (
                    <div>
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Encerramento
                      </h4>
                      <p className="text-muted-foreground">
                        {new Date(form.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perguntas ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma pergunta cadastrada.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{question.question_text}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tipo: {question.question_type === 'text' ? 'Texto' : question.question_type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Formulário não encontrado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};