import { useEffect } from "react";
import ThemePage from "@/components/ThemePage";

const Theme = () => {
  useEffect(() => {
    document.title = "Tema - Performance to Be";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Página de tema da pesquisa de clima organizacional");
    }
  }, []);

  return (
    <ThemePage 
      title="Tema Exemplo"
      description="Esta é uma página de exemplo para visualizar como os temas aparecem no formulário"
    />
  );
};

export default Theme;
