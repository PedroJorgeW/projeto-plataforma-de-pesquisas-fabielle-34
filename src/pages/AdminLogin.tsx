import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut, session } = useAuth();

  // Clear any existing session when component mounts to force fresh login
  useEffect(() => {
    const clearSessionAndRedirect = async () => {
      // If there's an existing session, clear it to force fresh login
      if (session) {
        await signOut();
      }
    };
    
    clearSessionAndRedirect();
  }, []); // Only run on mount

  // Redirect to admin only after successful login via handleSubmit
  useEffect(() => {
    if (session) {
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        let errorMessage = "Erro interno. Tente novamente.";
        
        if (error.includes("Invalid login credentials") || 
            error.includes("Email not confirmed") ||
            error.includes("Invalid email or password")) {
          errorMessage = "E-mail ou senha incorretos";
        } else if (error.includes("Email rate limit")) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (error.includes("Network")) {
          errorMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
        }
        
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: errorMessage,
        });
        return;
      }

      // Success - redirect will happen via useEffect
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao painel administrativo",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro interno",
        description: "Tente novamente em alguns instantes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/94c9c571-47aa-423f-b803-13621c9b9547.png" 
              alt="Performance to Be Logo" 
              className="h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
          <CardDescription>
            Acesse o painel de gerenciamento de pesquisas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do Administrador</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar no Painel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;