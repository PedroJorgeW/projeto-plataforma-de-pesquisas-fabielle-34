import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 bg-success-light rounded-full flex items-center justify-center">
                <img
                  src="/lovable-uploads/f78b05fe-ad94-44c2-a8e8-07be6424eb53.png"
                  alt="Logo Performance To Be"
                  className="h-22 w-22 object-contain"
                  loading="lazy"
                />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Obrigado pela sua participação!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              Suas respostas foram registradas com sucesso e servirão de base para estudos que visam fortalecer a organização.
            </p>

            <div className="bg-accent rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Sua opinião importa</span>
              </div>
              <p className="text-sm text-muted-foreground">
                🔒 Os dados são anônimos, protegidos em conformidade com a LGPD e utilizados exclusivamente para análises técnicas e estratégicas.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYou;