import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Checkbox } from "../../components/ui/checkbox";
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
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Scissors
} from "lucide-react";

export default function AdminFuncionarios() {
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    photo_url: "",
    is_active: true,
    service_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, servicesRes] = await Promise.all([
        axios.get(`${API}/employees/all`, { withCredentials: true }),
        axios.get(`${API}/services/all`, { withCredentials: true })
      ]);
      setEmployees(employeesRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email || "",
        phone: employee.phone || "",
        photo_url: employee.photo_url || "",
        is_active: employee.is_active,
        service_ids: employee.service_ids || []
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        photo_url: "",
        is_active: true,
        service_ids: []
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("O nome é obrigatório");
      return;
    }

    try {
      if (editingEmployee) {
        await axios.put(
          `${API}/employees/${editingEmployee.employee_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Funcionário atualizado com sucesso");
      } else {
        await axios.post(`${API}/employees`, formData, { withCredentials: true });
        toast.success("Funcionário cadastrado com sucesso");
      }
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar funcionário");
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      return;
    }

    try {
      await axios.delete(`${API}/employees/${employeeId}`, { withCredentials: true });
      toast.success("Funcionário removido com sucesso");
      fetchData();
    } catch (error) {
      toast.error("Erro ao remover funcionário");
    }
  };

  const toggleService = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const getServiceNames = (serviceIds) => {
    return serviceIds
      .map((id) => services.find((s) => s.service_id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" data-testid="admin-funcionarios">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Funcionários
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie a equipe do salão
            </p>
          </div>
          <Button 
            onClick={() => openDialog()}
            className="bg-primary text-primary-foreground rounded-full"
            data-testid="add-employee-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>

        {/* Employees Table */}
        <Card className="border border-muted shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : employees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, idx) => (
                    <TableRow key={employee.employee_id} data-testid={`employee-row-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {employee.photo_url ? (
                              <img 
                                src={employee.photo_url} 
                                alt={employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <p className="font-medium text-foreground">{employee.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {employee.email && <p className="text-muted-foreground">{employee.email}</p>}
                          {employee.phone && <p className="text-muted-foreground">{employee.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {employee.service_ids?.length > 0 
                            ? getServiceNames(employee.service_ids)
                            : "Nenhum serviço vinculado"
                          }
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={employee.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {employee.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDialog(employee)}
                            data-testid={`edit-employee-${idx}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(employee.employee_id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-employee-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhum funcionário cadastrado
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => openDialog()}
                >
                  Cadastrar primeiro funcionário
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do funcionário"
                data-testid="employee-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  data-testid="employee-email-input"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  data-testid="employee-phone-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="photo_url">URL da Foto</Label>
              <Input 
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
                data-testid="employee-photo-input"
              />
            </div>
            
            {/* Services */}
            <div>
              <Label className="mb-3 block">Serviços que realiza</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {services.map((service) => (
                  <div 
                    key={service.service_id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                  >
                    <Checkbox 
                      id={service.service_id}
                      checked={formData.service_ids.includes(service.service_id)}
                      onCheckedChange={() => toggleService(service.service_id)}
                    />
                    <label 
                      htmlFor={service.service_id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Funcionário Ativo</Label>
              <Switch 
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                data-testid="employee-active-switch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} data-testid="save-employee-btn">
              {editingEmployee ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
