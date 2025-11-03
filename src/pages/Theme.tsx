import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ThemePage from "@/components/ThemePage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const Theme = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("form_themes")
        .select("title, description")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar tema:", error);
        setLoading(false);
        return;
      }

      setTheme(data);
      setLoading(false);

      if (data) {
        document.title = `${data.title} - Performance to Be`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && data.description) {
          metaDescription.setAttribute("content", data.description);
        }
      }
    };

    fetchTheme();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Carregando tema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Tema não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ThemePage 
      title={theme.title}
      description={theme.description || ""}
    />
  );
};

export default Theme;
