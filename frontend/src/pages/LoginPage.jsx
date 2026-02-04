import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import axios from "axios";
import { API } from "../App";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    checkAuth();
    fetchTenant();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      if (response.data) {
        // Already logged in
        if (response.data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/agendar");
        }
      }
    } catch (error) {
      // Not authenticated, stay on login page
    }
  };

  const fetchTenant = async () => {
    try {
      const response = await axios.get(`${API}/tenant`);
      setTenant(response.data);
    } catch (error) {
      console.error("Error fetching tenant:", error);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/agendar";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1611211235015-e2e3a7d09e97?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Salão de beleza"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <h2 className="font-serif text-4xl font-bold">
            Sua beleza merece o melhor
          </h2>
          <p className="mt-4 text-white/90">
            Agende seus serviços de forma rápida e prática. 
            Estamos aqui para transformar seu dia.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="back-btn"
            className="mb-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">
                Bem-vindo ao {tenant?.name || "Salão"}
              </CardTitle>
              <CardDescription className="text-base">
                Faça login para agendar seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                data-testid="google-login-btn"
                className="w-full bg-card border-2 border-muted text-foreground hover:bg-muted/50 h-14 text-base font-medium transition-all duration-300 rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Conectando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continuar com Google</span>
                  </div>
                )}
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Ao continuar, você concorda com nossos{" "}
                <span className="text-primary cursor-pointer hover:underline">
                  Termos de Uso
                </span>{" "}
                e{" "}
                <span className="text-primary cursor-pointer hover:underline">
                  Política de Privacidade
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Primeiro acesso? O cadastro é automático ao fazer login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
