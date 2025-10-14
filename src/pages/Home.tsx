import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
const Home = () => {
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-8">
            <img src="/lovable-uploads/94c9c571-47aa-423f-b803-13621c9b9547.png" alt="Performance to Be Logo" className="h-32 object-contain" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Performance to Be
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Sistema de Pesquisas de Clima Organizacional
          </p>
          
          <div className="space-y-4">
            
            <div>
              <Link to="/tema">
                <Button size="sm">Exemplo de Página de Tema</Button>
              </Link>
            </div>
            
            <div className="pt-4">
              <Link to="/admin/login">
                <Button variant="outline" size="sm">
                  Acesso Administrativo
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Home;