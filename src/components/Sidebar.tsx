import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Formulários", href: "/admin/forms", icon: FileText },
  { name: "Resultados", href: "/admin/results", icon: BarChart3 },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

export const Sidebar = () => {
  return (
    <div className="hidden md:flex w-60 bg-card border-r border-border flex-col">
      <div className="p-4 lg:p-6">
        <div className="w-full mx-auto flex flex-col items-center mb-6 lg:mb-8">
          <img
            src="/lovable-uploads/f78b05fe-ad94-44c2-a8e8-07be6424eb53.png"
            alt="Logotipo Performance To Be"
            className="w-48 lg:w-56 h-auto object-contain"
            loading="lazy"
          />
        </div>
        
        <nav className="space-y-1 lg:space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};