import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";
import { API } from "../App";
import { 
  Calendar, 
  Clock, 
  Users, 
  Scissors, 
  Sparkles,
  ChevronRight,
  Star,
  Phone,
  MapPin
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const [tenantRes, servicesRes, employeesRes] = await Promise.all([
        axios.get(`${API}/tenant`),
        axios.get(`${API}/services`),
        axios.get(`${API}/employees`)
      ]);
      setTenant(tenantRes.data);
      setServices(servicesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleAgendar = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-muted/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-serif text-xl font-semibold text-foreground">
                {tenant?.name || "Salão de Beleza"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleLogin}
                data-testid="nav-login-btn"
                className="text-foreground hover:text-primary"
              >
                Entrar
              </Button>
              <Button 
                onClick={handleAgendar}
                data-testid="nav-agendar-btn"
                className="bg-primary text-primary-foreground rounded-full px-6 hover:bg-primary/90 transition-all hover:scale-105"
              >
                Agendar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden">
        <div className="hero-gradient absolute inset-0" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeIn">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
                Beleza que <br />
                <span className="text-primary">transforma</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg">
                Agende seu horário de forma rápida e prática. Encontre o serviço 
                ideal e deixe nossa equipe cuidar de você.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button 
                  onClick={handleAgendar}
                  data-testid="hero-agendar-btn"
                  className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Agendar Agora
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline"
                  data-testid="hero-servicos-btn"
                  onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-primary text-primary rounded-full px-8 py-6 text-lg font-medium hover:bg-primary hover:text-white"
                >
                  Ver Serviços
                </Button>
              </div>
            </div>
            <div className="relative animate-fadeIn stagger-2 hidden lg:block">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1611211235015-e2e3a7d09e97?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Salão de beleza moderno"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">4.9</p>
                    <p className="text-sm text-muted-foreground">+500 avaliações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: "Agendamento Online", desc: "Escolha o melhor horário para você" },
              { icon: Clock, title: "Sem Espera", desc: "Chegue no horário e seja atendido" },
              { icon: Users, title: "Profissionais Expert", desc: "Equipe qualificada e atenciosa" }
            ].map((feature, idx) => (
              <Card 
                key={idx} 
                className="bg-card border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Nossos Serviços
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma variedade de serviços para realçar sua beleza natural
            </p>
          </div>
          
          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <Card 
                  key={service.service_id}
                  data-testid={`service-card-${idx}`}
                  className="bg-card border border-muted shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-semibold text-foreground">
                          {service.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {service.description || "Serviço profissional com qualidade garantida"}
                        </p>
                      </div>
                      <Scissors className="w-5 h-5 text-primary ml-4" />
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-muted">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {service.duration} min
                      </div>
                      <span className="text-lg font-semibold text-primary">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Corte Feminino", duration: 60, price: 80 },
                  { name: "Coloração", duration: 120, price: 150 },
                  { name: "Manicure & Pedicure", duration: 90, price: 70 }
                ].map((service, idx) => (
                  <Card 
                    key={idx}
                    className="bg-card border border-muted shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <h3 className="font-serif text-lg font-semibold text-foreground">
                          {service.name}
                        </h3>
                        <Scissors className="w-5 h-5 text-primary" />
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-muted">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </div>
                        <span className="text-lg font-semibold text-primary">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="mt-8 text-muted-foreground">
                Faça login para ver todos os serviços disponíveis
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Team */}
      {employees.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Nossa Equipe
              </h2>
              <p className="mt-4 text-muted-foreground">
                Profissionais dedicados a realçar sua beleza
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {employees.map((emp, idx) => (
                <Card 
                  key={emp.employee_id}
                  data-testid={`employee-card-${idx}`}
                  className="bg-card border-none shadow-sm hover:shadow-md transition-all duration-300 text-center"
                >
                  <CardContent className="p-6">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 overflow-hidden">
                      {emp.photo_url ? (
                        <img 
                          src={emp.photo_url} 
                          alt={emp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {emp.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Profissional
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Pronto para se transformar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Agende seu horário agora e experimente o melhor da beleza
          </p>
          <Button 
            onClick={handleAgendar}
            data-testid="cta-agendar-btn"
            className="mt-8 bg-primary text-primary-foreground rounded-full px-10 py-6 text-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Agendar Agora
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6" />
                <span className="font-serif text-xl font-semibold">
                  {tenant?.name || "Salão de Beleza"}
                </span>
              </div>
              <p className="text-primary-foreground/80 text-sm">
                Transformando vidas através da beleza
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-2 text-sm text-primary-foreground/80">
                {tenant?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {tenant.phone}
                  </div>
                )}
                {tenant?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {tenant.address}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Horários</h4>
              <div className="text-sm text-primary-foreground/80">
                <p>Segunda a Sexta: 08h - 20h</p>
                <p>Sábado: 08h - 18h</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {tenant?.name || "Salão de Beleza"}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
