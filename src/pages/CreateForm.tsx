import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  text: string;
}

const CreateForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "" }
  ]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: ""
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o formulário.",
        variant: "destructive"
      });
      return;
    }

    if (!endDate) {
      toast({
        title: "Erro", 
        description: "Por favor, defina uma data de encerramento.",
        variant: "destructive"
      });
      return;
    }

    const emptyQuestions = questions.filter(q => !q.text.trim());
    if (emptyQuestions.length > 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todas as perguntas.",
        variant: "destructive"
      });
      return;
    }

    // Here you would save to Supabase with anonymous response collection
    const formData = {
      name: formName,
      description: formDescription,
      endDate: endDate,
      questions: questions,
      active: true,
      createdAt: new Date().toISOString()
    };

    console.log('Form data to save:', formData);

    toast({
      title: "Sucesso",
      description: "Formulário criado com sucesso!",
    });
    navigate("/admin/forms");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/forms")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Criar Formulário</h1>
          <p className="text-muted-foreground">Crie um novo formulário de clima organizacional</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="form-name">Nome do Formulário</Label>
              <Input
                id="form-name"
                placeholder="Ex: Clima Organizacional 2025"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="form-description">Descrição (opcional)</Label>
              <Textarea
                id="form-description"
                placeholder="Descreva o objetivo desta pesquisa..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data de Encerramento</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perguntas</CardTitle>
            <p className="text-sm text-muted-foreground">
              As perguntas terão opções de resposta: Muito Satisfeito, Satisfeito, Insatisfeito
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Label htmlFor={`question-${question.id}`}>
                    Pergunta {index + 1}
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    placeholder="Digite sua pergunta aqui..."
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    rows={2}
                  />
                </div>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                    className="mt-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/admin/forms")}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Formulário
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;