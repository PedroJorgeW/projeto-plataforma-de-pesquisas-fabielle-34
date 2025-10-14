import ThemePage from "@/components/ThemePage";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Theme = () => {
  const [params] = useSearchParams();
  const title = params.get("title") || "Exemplo de Tema";
  const description =
    params.get("description") ||
    "Esta é a página de Tema que aparece no formulário público, exibindo o nome do tema e sua descrição na ordem definida pelo administrador.";

  useEffect(() => {
    document.title = `${title} – Tema do Formulário`;
    const desc = description.slice(0, 155);
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background">
      <ThemePage title={title} description={description} />
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto max-w-2xl flex justify-end">
          <Link to="/">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Theme;
