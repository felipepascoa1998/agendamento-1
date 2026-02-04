import { useState, useEffect } from "react";
import { ClientLayout } from "../../components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import axios from "axios";
import { API } from "../../App";
import { toast } from "sonner";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  RefreshCw,
  X,
  CalendarDays
} from "lucide-react";

export default function ClienteMeusAgendamentos() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`, { withCredentials: true });
      setAppointments(response.data);
    } catch (error) {
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const today = startOfDay(new Date());
  
  const upcomingAppointments = appointments.filter((appt) => {
    const apptDate = parseISO(appt.date);
    return (isAfter(apptDate, today) || format(apptDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) 
      && appt.status !== "cancelled" && appt.status !== "completed";
  });

  const pastAppointments = appointments.filter((appt) => {
    const apptDate = parseISO(appt.date);
    return isBefore(apptDate, today) || appt.status === "completed" || appt.status === "cancelled";
  });

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, { withCredentials: true });
      toast.success("Agendamento cancelado");
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Informe a nova data e horário");
      return;
    }

    try {
      await axios.put(
        `${API}/appointments/${selectedAppointment.appointment_id}/reschedule?date=${rescheduleDate}&time=${rescheduleTime}`,
        {},
        { withCredentials: true }
      );
      toast.success("Agendamento remarcado com sucesso");
      fetchAppointments();
      setRescheduleDialog(false);
      setSelectedAppointment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao remarcar");
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

  const AppointmentCard = ({ appt, idx, showActions = false }) => (
    <Card 
      key={appt.appointment_id}
      data-testid={`appointment-card-${idx}`}
      className="border border-muted shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => setSelectedAppointment(appt)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {format(parseISO(appt.date), "dd")}
              </span>
              <span className="text-xs text-primary uppercase">
                {format(parseISO(appt.date), "MMM", { locale: ptBR })}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{appt.service_name}</p>
              <p className="text-sm text-muted-foreground">
                {appt.employee_name} • {appt.time}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(appt.status)}
            <p className="mt-1 text-sm font-medium text-primary">
              R$ {appt.service_price?.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8" data-testid="cliente-agendamentos">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Meus Agendamentos
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe seus agendamentos
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Próximos ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Anteriores ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments
                  .sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return a.time.localeCompare(b.time);
                  })
                  .map((appt, idx) => (
                    <AppointmentCard key={appt.appointment_id} appt={appt} idx={idx} showActions />
                  ))}
              </div>
            ) : (
              <Card className="border border-muted shadow-sm">
                <CardContent className="p-12 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Você não tem agendamentos próximos
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = "/agendar"}
                    data-testid="new-appointment-btn"
                  >
                    Agendar Agora
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : pastAppointments.length > 0 ? (
              <div className="space-y-4">
                {pastAppointments
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((appt, idx) => (
                    <AppointmentCard key={appt.appointment_id} appt={appt} idx={idx} />
                  ))}
              </div>
            ) : (
              <Card className="border border-muted shadow-sm">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum agendamento anterior
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment && !rescheduleDialog} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{selectedAppointment.service_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                  <p className="font-medium">{selectedAppointment.employee_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(parseISO(selectedAppointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-muted">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-primary">
                    R$ {selectedAppointment.service_price?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          {selectedAppointment && (selectedAppointment.status === "pending" || selectedAppointment.status === "confirmed") && (
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button 
                variant="outline"
                onClick={() => {
                  setRescheduleDate(selectedAppointment.date);
                  setRescheduleTime(selectedAppointment.time);
                  setRescheduleDialog(true);
                }}
                data-testid="reschedule-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Remarcar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleCancel(selectedAppointment.appointment_id)}
                data-testid="cancel-btn"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Remarcar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data</Label>
              <Input 
                type="date" 
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                data-testid="reschedule-date-input"
              />
            </div>
            <div>
              <Label>Novo Horário</Label>
              <Input 
                type="time" 
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                data-testid="reschedule-time-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReschedule} data-testid="confirm-reschedule-btn">
              Confirmar Remarcação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
