import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Users, Clock } from "lucide-react";

const availableSurveys = [
  {
    id: 1,
    name: "Clima Organizacional 2025",
    description: "Pesquisa anual sobre o ambiente de trabalho e satisfação dos colaboradores",
    estimatedTime: "5-8 minutos",
    questions: 12,
    company: "TechCorp Solutions"
  },
  {
    id: 2,
    name: "Satisfação com Liderança",
    description: "Avalie a qualidade da liderança e gestão em sua equipe",
    estimatedTime: "3-5 minutos", 
    questions: 8,
    company: "TechCorp Solutions"
  },
  {
    id: 3,
    name: "Ambiente de Trabalho",
    description: "Como você se sente em relação ao seu ambiente de trabalho atual",
    estimatedTime: "4-6 minutos",
    questions: 10,
    company: "TechCorp Solutions"
  }
];

const SurveyList = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="h-14 w-14 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center">
              <img
                src="/lovable-uploads/f78b05fe-ad94-44c2-a8e8-07be6424eb53.png"
                alt="Logo Performance To Be"
                className="h-12 w-12 object-contain"
                loading="lazy"
              />
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground text-center">Performance To Be</h1>
          </div>
          <h2 className="text-xl text-muted-foreground">Pesquisas Disponíveis</h2>
          <p className="text-muted-foreground mt-2">
            Sua opinião é importante para nós. Participe das pesquisas abaixo.
          </p>
        </div>

        <div className="space-y-6">
          {availableSurveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{survey.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{survey.company}</p>
                  </div>
                  <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{survey.description}</p>
                
                <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{survey.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{survey.questions} perguntas</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to={`/survey/${survey.id}`}>
                    <Button>
                      Responder Pesquisa
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Suas respostas são confidenciais e serão utilizadas apenas para melhorar nosso ambiente de trabalho.</p>
        </div>
      </div>
    </div>
  );
};

export default SurveyList;