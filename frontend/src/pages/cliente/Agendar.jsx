import { useState, useEffect } from "react";
import { ClientLayout } from "../../components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Calendar } from "../../components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "../../components/ui/select";
import axios from "axios";
import { API, useAuth } from "../../App";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

const STEPS = ["service", "employee", "datetime", "confirm"];

export default function ClienteAgendar() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState({
    service_id: "",
    employee_id: "",
    date: null,
    time: "",
    client_name: user?.name || "",
    client_email: user?.email || "",
    client_phone: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (booking.employee_id && booking.date && booking.service_id) {
      fetchAvailableSlots();
    }
  }, [booking.employee_id, booking.date, booking.service_id]);

  const fetchData = async () => {
    try {
      const [servicesRes, employeesRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/employees`)
      ]);
      setServices(servicesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const dateStr = format(booking.date, "yyyy-MM-dd");
      const response = await axios.get(
        `${API}/appointments/available-slots?employee_id=${booking.employee_id}&date=${dateStr}&service_id=${booking.service_id}`
      );
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      toast.error("Erro ao buscar horários");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!booking.client_name || !booking.client_email) {
      toast.error("Preencha seu nome e email");
      return;
    }

    try {
      await axios.post(`${API}/appointments`, {
        service_id: booking.service_id,
        employee_id: booking.employee_id,
        date: format(booking.date, "yyyy-MM-dd"),
        time: booking.time,
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone
      }, { withCredentials: true });

      toast.success("Agendamento realizado com sucesso!");
      
      // Reset
      setStep(0);
      setBooking({
        service_id: "",
        employee_id: "",
        date: null,
        time: "",
        client_name: user?.name || "",
        client_email: user?.email || "",
        client_phone: ""
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao agendar");
    }
  };

  const selectedService = services.find((s) => s.service_id === booking.service_id);
  const selectedEmployee = employees.find((e) => e.employee_id === booking.employee_id);

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!booking.service_id;
      case 1:
        return !!booking.employee_id;
      case 2:
        return !!booking.date && !!booking.time;
      case 3:
        return !!booking.client_name && !!booking.client_email;
      default:
        return false;
    }
  };

  const isDateDisabled = (date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-8" data-testid="cliente-agendar">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <div 
                key={s}
                className={`
                  flex items-center gap-2
                  ${idx <= step ? "text-primary" : "text-muted-foreground"}
                `}
              >
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${idx < step ? "bg-primary text-white" : idx === step ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted"}
                  `}
                >
                  {idx < step ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 ${idx < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">
              {step === 0 && "Escolha o Serviço"}
              {step === 1 && "Escolha o Profissional"}
              {step === 2 && "Escolha Data e Horário"}
              {step === 3 && "Confirmar Agendamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {/* Step 0 - Service Selection */}
                {step === 0 && (
                  <div className="space-y-3">
                    {services.map((service, idx) => (
                      <div
                        key={service.service_id}
                        data-testid={`select-service-${idx}`}
                        onClick={() => setBooking({ ...booking, service_id: service.service_id })}
                        className={`
                          p-4 rounded-xl cursor-pointer transition-all
                          ${booking.service_id === service.service_id 
                            ? "bg-primary/10 border-2 border-primary" 
                            : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Scissors className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.duration} min
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-primary">
                            R$ {service.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 1 - Employee Selection */}
                {step === 1 && (
                  <div className="space-y-3">
                    {employees
                      .filter((emp) => !emp.service_ids?.length || emp.service_ids.includes(booking.service_id))
                      .map((employee, idx) => (
                        <div
                          key={employee.employee_id}
                          data-testid={`select-employee-${idx}`}
                          onClick={() => setBooking({ ...booking, employee_id: employee.employee_id })}
                          className={`
                            p-4 rounded-xl cursor-pointer transition-all
                            ${booking.employee_id === employee.employee_id 
                              ? "bg-primary/10 border-2 border-primary" 
                              : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {employee.photo_url ? (
                                <img 
                                  src={employee.photo_url} 
                                  alt={employee.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">Profissional</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Step 2 - Date & Time Selection */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">Selecione a Data</Label>
                      <Calendar
                        mode="single"
                        selected={booking.date}
                        onSelect={(date) => {
                          setBooking({ ...booking, date, time: "" });
                          setAvailableSlots([]);
                        }}
                        disabled={isDateDisabled}
                        locale={ptBR}
                        className="rounded-md border mx-auto"
                      />
                    </div>

                    {booking.date && (
                      <div>
                        <Label className="mb-2 block">Selecione o Horário</Label>
                        {slotsLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map((slot) => (
                              <Button
                                key={slot}
                                variant={booking.time === slot ? "default" : "outline"}
                                onClick={() => setBooking({ ...booking, time: slot })}
                                data-testid={`select-time-${slot}`}
                                className={booking.time === slot ? "bg-primary" : ""}
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            Nenhum horário disponível para esta data
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 - Confirmation */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                      <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Serviço</p>
                          <p className="font-medium">{selectedService?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Profissional</p>
                          <p className="font-medium">{selectedEmployee?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Data e Horário</p>
                          <p className="font-medium">
                            {format(booking.date, "dd 'de' MMMM", { locale: ptBR })} às {booking.time}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-muted">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-xl font-bold text-primary">
                            R$ {selectedService?.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="client_name">Seu Nome *</Label>
                        <Input 
                          id="client_name"
                          value={booking.client_name}
                          onChange={(e) => setBooking({ ...booking, client_name: e.target.value })}
                          placeholder="Nome completo"
                          data-testid="client-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_email">Seu Email *</Label>
                        <Input 
                          id="client_email"
                          type="email"
                          value={booking.client_email}
                          onChange={(e) => setBooking({ ...booking, client_email: e.target.value })}
                          placeholder="seu@email.com"
                          data-testid="client-email-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_phone">Telefone (opcional)</Label>
                        <Input 
                          id="client_phone"
                          value={booking.client_phone}
                          onChange={(e) => setBooking({ ...booking, client_phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          data-testid="client-phone-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                data-testid="prev-step-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  data-testid="next-step-btn"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground"
                  data-testid="confirm-booking-btn"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Agendamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
