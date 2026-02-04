import { useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import axios from "axios";
import { API } from "../../App";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Scissors,
  Users,
  BarChart3
} from "lucide-react";

export default function AdminRelatorios() {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Selecione o período");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/reports/revenue?date_from=${dateFrom}&date_to=${dateTo}`,
        { withCredentials: true }
      );
      setReport(response.data);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" data-testid="admin-relatorios">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Relatórios
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe o faturamento do salão
          </p>
        </div>

        {/* Filter */}
        <Card className="border border-muted shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1">
                <Label>Data Inicial</Label>
                <Input 
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="report-date-from"
                />
              </div>
              <div className="flex-1">
                <Label>Data Final</Label>
                <Input 
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="report-date-to"
                />
              </div>
              <Button 
                onClick={fetchReport}
                disabled={loading}
                className="bg-primary text-primary-foreground"
                data-testid="generate-report-btn"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {report && (
          <div className="space-y-6 animate-fadeIn">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border border-muted shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Faturamento Total</p>
                      <p className="text-3xl font-bold text-primary mt-1">
                        R$ {report.total_revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <DollarSign className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-muted shadow-sm bg-gradient-to-br from-accent/5 to-accent/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Atendimentos Concluídos</p>
                      <p className="text-3xl font-bold text-accent mt-1">
                        {report.total_appointments}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Service */}
            <Card className="border border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Faturamento por Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(report.by_service).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(report.by_service).map(([name, data]) => (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} atendimento{data.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-primary">
                          R$ {data.revenue.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum serviço concluído no período
                  </p>
                )}
              </CardContent>
            </Card>

            {/* By Employee */}
            <Card className="border border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Faturamento por Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(report.by_employee).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(report.by_employee).map(([name, data]) => (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} atendimento{data.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-primary">
                          R$ {data.revenue.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum funcionário com atendimentos no período
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <Card className="border border-muted shadow-sm">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Selecione o período e clique em "Gerar Relatório" para visualizar os dados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
