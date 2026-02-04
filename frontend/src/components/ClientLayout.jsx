import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import {
  Calendar,
  ClipboardList,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export function ClientLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success("Logout realizado com sucesso");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-md border-b border-muted">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">
              Salão de Beleza
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/agendar"
              data-testid="nav-agendar"
              className={`
                flex items-center gap-2 text-sm font-medium transition-colors
                ${isActive("/agendar") ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </Link>
            <Link
              to="/meus-agendamentos"
              data-testid="nav-meus-agendamentos"
              className={`
                flex items-center gap-2 text-sm font-medium transition-colors
                ${isActive("/meus-agendamentos") ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <ClipboardList className="w-4 h-4" />
              Meus Agendamentos
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
                  data-testid="user-menu-trigger"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-muted">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  data-testid="logout-btn"
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-muted shadow-lg">
            <nav className="flex flex-col p-4 gap-2">
              <Link
                to="/agendar"
                data-testid="mobile-nav-agendar"
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive("/agendar") ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                `}
              >
                <Calendar className="w-5 h-5" />
                Agendar
              </Link>
              <Link
                to="/meus-agendamentos"
                data-testid="mobile-nav-meus-agendamentos"
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive("/meus-agendamentos") ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                `}
              >
                <ClipboardList className="w-5 h-5" />
                Meus Agendamentos
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
