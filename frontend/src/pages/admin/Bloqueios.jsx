import { Plus, Trash2, Clock, Calendar as CalendarIcon, Ban, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import axios from "axios";
import { API } from "../../App";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function AdminBloqueios() {
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    date: "",
    is_whole_day: true,
    start_time: "",
    end_time: "",
    reason: ""
  });
  const [editingBlock, setEditingBlock] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [blockedRes, employeesRes] = await Promise.all([
        axios.get(`${API}/blocked-times`, { withCredentials: true }),
        axios.get(`${API}/employees/all`, { withCredentials: true })
      ]);
      setBlockedTimes(blockedRes.data);
      console.log('BlockedTimes:', blockedRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setEditingBlock(null);
    setDialogOpen(true);
  };

  const openEditDialog = (block) => {
    setFormData({
      employee_id: block.employee_id,
      date: block.date,
      is_whole_day: block.is_whole_day,
      start_time: block.start_time || "",
      end_time: block.end_time || "",
      reason: block.reason || ""
    });
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.employee_id || !formData.date) {
      toast.error("Selecione o funcionário e a data");
      return;
    }

    if (!formData.is_whole_day && (!formData.start_time || !formData.end_time)) {
      toast.error("Informe o horário inicial e final");
      return;
    }

    try {
      const payload = {
        employee_id: formData.employee_id,
        date: formData.date,
        start_time: formData.is_whole_day ? null : formData.start_time,
        end_time: formData.is_whole_day ? null : formData.end_time,
        reason: formData.reason || null
      };

      if (editingBlock) {
        await axios.put(`${API}/blocked-times/${editingBlock.blocked_id}`, payload, { withCredentials: true });
        toast.success("Bloqueio atualizado com sucesso");
      } else {
        await axios.post(`${API}/blocked-times`, payload, { withCredentials: true });
        toast.success("Bloqueio criado com sucesso");
      }
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || (editingBlock ? "Erro ao atualizar bloqueio" : "Erro ao criar bloqueio"));
    }
  };

  const handleDelete = async (blockedId) => {
    if (!window.confirm("Tem certeza que deseja remover este bloqueio?")) {
      return;
    }

    try {
      await axios.delete(`${API}/blocked-times/${blockedId}`, { withCredentials: true });
      toast.success("Bloqueio removido com sucesso");
      fetchData();
    } catch (error) {
      toast.error("Erro ao remover bloqueio");
    }
  };

  const getEmployeeName = (employeeId) => {
    return employees.find((e) => e.employee_id === employeeId)?.name || "Desconhecido";
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" data-testid="admin-bloqueios">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Bloqueios de Horário
            </h1>
            <p className="mt-2 text-muted-foreground">
              Bloqueie horários para folgas, almoço ou reuniões
            </p>
          </div>
          <Button 
            onClick={openDialog}
            className="bg-primary text-primary-foreground rounded-full"
            data-testid="add-block-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Bloqueio
          </Button>
        </div>

        {/* Blocked Times Table */}
        <Card className="border border-muted shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : blockedTimes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedTimes.map((block, idx) => (
                    <TableRow key={block.blocked_id} data-testid={`block-row-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Ban className="w-5 h-5 text-red-600" />
                          </div>
                          <p className="font-medium text-foreground">
                            {getEmployeeName(block.employee_id)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          {format(parseISO(block.date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {block.is_whole_day ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Dia inteiro
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {block.start_time} - {block.end_time}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {block.reason || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(block)}
                          className="text-primary hover:text-primary"
                          data-testid={`edit-block-${idx}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(block.blocked_id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-block-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhum bloqueio de horário cadastrado
                </p>
                <Button 
                  className="mt-4"
                  onClick={openDialog}
                >
                  Criar primeiro bloqueio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Block Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Novo Bloqueio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Funcionário *</Label>
              <Select 
                value={formData.employee_id} 
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger data-testid="block-employee-select">
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data *</Label>
              <Input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="block-date-input"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Bloquear dia inteiro</Label>
              <Switch 
                checked={formData.is_whole_day}
                onCheckedChange={(checked) => setFormData({ ...formData, is_whole_day: checked })}
                data-testid="block-whole-day-switch"
              />
            </div>

            {!formData.is_whole_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Início</Label>
                  <Input 
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    data-testid="block-start-time-input"
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input 
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    data-testid="block-end-time-input"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Motivo</Label>
              <Input 
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ex: Folga, Almoço, Reunião..."
                data-testid="block-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} data-testid="save-block-btn">
                {editingBlock ? "Salvar Alterações" : "Criar Bloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
