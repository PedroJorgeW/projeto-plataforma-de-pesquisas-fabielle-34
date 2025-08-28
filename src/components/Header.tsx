import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { MobileSidebar } from "./MobileSidebar";

interface HeaderProps {
  userType?: 'admin' | 'user';
}

export const Header = ({
  userType = 'user'
}: HeaderProps) => {
  const isAdmin = userType === 'admin';
  const { signOut, adminUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Tente novamente",
      });
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MobileSidebar />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm md:text-lg font-semibold text-foreground truncate">
            {isAdmin ? 'Painel Administrador' : 'Painel Usuário'}
          </h2>
          {adminUser && (
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              Bem-vindo, {adminUser.nome}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sair">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Sair</span>
        </Button>
      </div>
    </header>
  );
};