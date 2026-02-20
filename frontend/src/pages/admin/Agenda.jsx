import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Calendar } from "../../components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import axios from "axios";
import { API } from "../../App";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  User,
  Phone,
  Mail,
  Scissors,
  CalendarDays,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  Bell
} from "lucide-react";

export default function AdminAgenda() {
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, employeesRes] = await Promise.all([
        axios.get(`${API}/appointments`, { withCredentials: true }),
        axios.get(`${API}/employees/all`, { withCredentials: true })
      ]);
      setAppointments(appointmentsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const dateMatch = format(selectedDate, "yyyy-MM-dd") === appt.date;
    const employeeMatch = selectedEmployee === "all" || appt.employee_id === selectedEmployee;
    const statusMatch = statusFilter === "all" || appt.status === statusFilter;
    return dateMatch && employeeMatch && statusMatch;
  });

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(
        `${API}/appointments/${appointmentId}/status?status=${newStatus}`,
        {},
        { withCredentials: true }
      );
      toast.success(`Agendamento ${newStatus === "completed" ? "concluído" : newStatus === "confirmed" ? "confirmado" : "atualizado"}`);
      fetchData();
      setSelectedAppointment(null);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, { withCredentials: true });
      toast.success("Agendamento cancelado");
      fetchData();
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
      fetchData();
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

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" data-testid="admin-agenda">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Agenda
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os agendamentos do salão
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Calendar & Filters */}
          <Card className="lg:col-span-1 border border-muted shadow-sm">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md"
              />
              
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Funcionário</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="mt-1" data-testid="filter-employee">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1" data-testid="filter-status">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main - Appointments List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-serif text-lg font-semibold text-foreground">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h2>
              <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Appointments */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                {filteredAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appt, idx) => (
                    <Card 
                      key={appt.appointment_id}
                      data-testid={`appointment-card-${idx}`}
                      className="border border-muted shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedAppointment(appt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 text-center">
                              <p className="text-2xl font-bold text-primary">{appt.time}</p>
                            </div>
                            <div className="border-l border-muted pl-4">
                              <p className="font-semibold text-foreground">{appt.client_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {appt.service_name} • {appt.employee_name}
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
                  ))}
              </div>
            ) : (
              <Card className="border border-muted shadow-sm">
                <CardContent className="p-12 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum agendamento para esta data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedAppointment.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAppointment.client_email}</p>
                </div>
              </div>
              {selectedAppointment.client_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedAppointment.client_phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">
                    {selectedAppointment.service_name} - R$ {selectedAppointment.service_price?.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">
                    {format(parseISO(selectedAppointment.date), "dd/MM/yyyy", { locale: ptBR })} às {selectedAppointment.time}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedAppointment.status)}
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {selectedAppointment?.status === "pending" && (
              <Button 
                onClick={() => updateStatus(selectedAppointment.appointment_id, "confirmed")}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="confirm-appointment-btn"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            )}
            {(selectedAppointment?.status === "pending" || selectedAppointment?.status === "confirmed") && (
              <>
                <Button 
                  onClick={() => updateStatus(selectedAppointment.appointment_id, "completed")}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="complete-appointment-btn"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Concluir
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setRescheduleDate(selectedAppointment.date);
                    setRescheduleTime(selectedAppointment.time);
                    setRescheduleDialog(true);
                  }}
                  data-testid="reschedule-appointment-btn"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Remarcar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => cancelAppointment(selectedAppointment.appointment_id)}
                  data-testid="cancel-appointment-btn"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </>
            )}
          </DialogFooter>
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
    </AdminLayout>
  );
}
