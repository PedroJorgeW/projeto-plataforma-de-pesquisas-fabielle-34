import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const surveyData = {
  1: {
    name: "Clima Organizacional 2025",
    company: "TechCorp Solutions",
    questions: [
      "Como você avalia o ambiente de trabalho na sua equipe?",
      "Qual o seu nível de satisfação com a comunicação interna?",
      "Como você se sente em relação ao reconhecimento do seu trabalho?",
      "O quanto você confia na liderança da empresa?",
      "Como você avalia as oportunidades de crescimento profissional?",
      "Qual o seu nível de satisfação com os benefícios oferecidos?",
      "Como você avalia o equilíbrio entre vida pessoal e profissional?",
      "O quanto você se sente motivado a dar o seu melhor no trabalho?"
    ]
  }
};

const responseOptions = [
  { value: "muito_satisfeito", label: "Muito Satisfeito" },
  { value: "satisfeito", label: "Satisfeito" },
  { value: "insatisfeito", label: "Insatisfeito" }
];

const SurveyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const survey = id ? surveyData[parseInt(id) as keyof typeof surveyData] : undefined;
  
  if (!survey) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-foreground">Pesquisa não encontrada</h1>
        <Button onClick={() => navigate('/survey')} className="mt-4">
          Voltar para lista de pesquisas
        </Button>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestion === survey.questions.length - 1;
  const canProceed = answers[currentQuestion] !== undefined;

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (!canProceed) {
      toast({
        title: "Resposta obrigatória",
        description: "Por favor, selecione uma resposta antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    if (isLastQuestion) {
      // Submit survey
      toast({
        title: "Pesquisa enviada!",
        description: "Obrigado por participar da nossa pesquisa.",
      });
      navigate('/thank-you');
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center">
              <img
                src="/lovable-uploads/f78b05fe-ad94-44c2-a8e8-07be6424eb53.png"
                alt="Logo Performance To Be"
                className="h-10 w-10 object-contain"
                loading="lazy"
              />
            </div>
            <span className="mt-3 text-lg font-medium text-foreground">Performance To Be</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{survey.name}</h1>
          <p className="text-muted-foreground">{survey.company}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Pergunta {currentQuestion + 1} de {survey.questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {survey.questions[currentQuestion]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion] || ""}
              onValueChange={handleAnswerChange}
              className="space-y-4"
            >
              {responseOptions.map((option) => (
                <div 
                  key={option.value} 
                  className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors ${
                    answers[currentQuestion] === option.value 
                      ? option.value === 'muito_satisfeito' 
                        ? 'border-very-satisfied bg-very-satisfied/10'
                        : option.value === 'satisfeito'
                        ? 'border-satisfied bg-satisfied/10'
                        : 'border-unsatisfied bg-unsatisfied/10'
                      : 'border-border'
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value}
                    className={`flex-1 cursor-pointer font-medium ${
                      answers[currentQuestion] === option.value 
                        ? option.value === 'muito_satisfeito' 
                          ? 'text-very-satisfied'
                          : option.value === 'satisfeito'
                          ? 'text-satisfied'
                          : 'text-unsatisfied'
                        : ''
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLastQuestion ? "Enviar Respostas" : "Próxima"}
            {!isLastQuestion && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;