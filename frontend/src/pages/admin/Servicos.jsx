import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
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
  Scissors,
  Clock,
  DollarSign
} from "lucide-react";

export default function AdminServicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 30,
    price: 0,
    description: "",
    is_active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services/all`, { withCredentials: true });
      setServices(response.data);
    } catch (error) {
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description || "",
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        duration: 30,
        price: 0,
        description: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.duration <= 0 || formData.price < 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingService) {
        await axios.put(
          `${API}/services/${editingService.service_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Serviço atualizado com sucesso");
      } else {
        await axios.post(`${API}/services`, formData, { withCredentials: true });
        toast.success("Serviço criado com sucesso");
      }
      fetchServices();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar serviço");
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) {
      return;
    }

    try {
      await axios.delete(`${API}/services/${serviceId}`, { withCredentials: true });
      toast.success("Serviço removido com sucesso");
      fetchServices();
    } catch (error) {
      toast.error("Erro ao remover serviço");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" data-testid="admin-servicos">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Serviços
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie os serviços oferecidos pelo salão
            </p>
          </div>
          <Button 
            onClick={() => openDialog()}
            className="bg-primary text-primary-foreground rounded-full"
            data-testid="add-service-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Services Table */}
        <Card className="border border-muted shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, idx) => (
                    <TableRow key={service.service_id} data-testid={`service-row-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={service.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {service.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDialog(service)}
                            data-testid={`edit-service-${idx}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(service.service_id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-service-${idx}`}
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
                <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhum serviço cadastrado
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => openDialog()}
                >
                  Cadastrar primeiro serviço
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingService ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Corte Feminino"
                data-testid="service-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duração (min) *</Label>
                <Input 
                  id="duration"
                  type="number"
                  min="5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  data-testid="service-duration-input"
                />
              </div>
              <div>
                <Label htmlFor="price">Valor (R$) *</Label>
                <Input 
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  data-testid="service-price-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do serviço"
                rows={3}
                data-testid="service-description-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Serviço Ativo</Label>
              <Switch 
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                data-testid="service-active-switch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} data-testid="save-service-btn">
              {editingService ? "Salvar Alterações" : "Criar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
