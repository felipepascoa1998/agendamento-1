import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import axios from "axios";
import { API } from "../../App";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Clock,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalServices: 0,
    totalEmployees: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const [appointmentsRes, servicesRes, employeesRes] = await Promise.all([
        axios.get(`${API}/appointments`, { withCredentials: true }),
        axios.get(`${API}/services/all`, { withCredentials: true }),
        axios.get(`${API}/employees/all`, { withCredentials: true })
      ]);

      const appointments = appointmentsRes.data;
      const todayAppts = appointments.filter(a => a.date === today && a.status !== "cancelled");
      const pendingAppts = appointments.filter(a => a.status === "pending");
      const upcoming = appointments
        .filter(a => a.date >= today && a.status !== "cancelled")
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        })
        .slice(0, 5);

      setStats({
        todayAppointments: todayAppts.length,
        pendingAppointments: pendingAppts.length,
        totalServices: servicesRes.data.length,
        totalEmployees: employeesRes.data.length
      });

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado"
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatAppointmentDate = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8" data-testid="admin-dashboard">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Visão geral do seu salão
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { 
              label: "Agendamentos Hoje", 
              value: stats.todayAppointments, 
              icon: Calendar,
              color: "bg-primary/10 text-primary"
            },
            { 
              label: "Pendentes", 
              value: stats.pendingAppointments, 
              icon: Clock,
              color: "bg-yellow-100 text-yellow-700"
            },
            { 
              label: "Serviços", 
              value: stats.totalServices, 
              icon: Scissors,
              color: "bg-accent/20 text-accent"
            },
            { 
              label: "Funcionários", 
              value: stats.totalEmployees, 
              icon: Users,
              color: "bg-blue-100 text-blue-700"
            }
          ].map((stat, idx) => (
            <Card 
              key={idx}
              data-testid={`stat-card-${idx}`}
              className="border border-muted shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Upcoming Appointments */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border border-muted shadow-sm animate-fadeIn" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/agenda">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  data-testid="quick-action-agenda"
                >
                  <span className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    Ver Agenda Completa
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/admin/servicos">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  data-testid="quick-action-servicos"
                >
                  <span className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-primary" />
                    Gerenciar Serviços
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/admin/relatorios">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12"
                  data-testid="quick-action-relatorios"
                >
                  <span className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Ver Relatórios
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="border border-muted shadow-sm animate-fadeIn" style={{ animationDelay: "0.5s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg">Próximos Agendamentos</CardTitle>
              <Link to="/admin/agenda">
                <Button variant="ghost" size="sm" data-testid="view-all-appointments">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appt, idx) => (
                    <div 
                      key={appt.appointment_id}
                      data-testid={`upcoming-appointment-${idx}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {appt.client_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appt.service_name} • {appt.employee_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {formatAppointmentDate(appt.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">{appt.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum agendamento próximo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
