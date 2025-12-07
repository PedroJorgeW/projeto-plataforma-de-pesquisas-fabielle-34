import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ThemePageProps {
  title: string;
  description: string;
}

const ThemePage = ({ title, description }: ThemePageProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {title}
            </h1>
            
            {description && (
              <p className="text-lg text-muted-foreground mb-6 break-words">
                {description}
              </p>
            )}

            <div className="bg-accent rounded-lg p-6">
              <p className="text-sm text-muted-foreground">
                Continue para responder as perguntas relacionadas a este tema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemePage;
