import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetDashboardStats,
  useGetOsPorStatus,
  useGetVendasRecentes,
  useGetOsAtrasadas,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  ShoppingCart, FileText, ClipboardList, Users,
  DollarSign, AlertCircle, TrendingUp, Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_projeto: "Em Projeto",
  em_revisao: "Em Revisão",
  em_producao: "Em Produção",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  em_projeto: "bg-blue-100 text-blue-800",
  em_revisao: "bg-purple-100 text-purple-800",
  em_producao: "bg-orange-100 text-orange-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

const prioridadeColors: Record<string, string> = {
  verde: "bg-green-500",
  amarelo: "bg-yellow-500",
  vermelho: "bg-red-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  const dt = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: osPorStatus, isLoading: osStatusLoading } = useGetOsPorStatus();
  const { data: vendasRecentes, isLoading: vendasLoading } = useGetVendasRecentes();
  const { data: osAtrasadas, isLoading: atrasadasLoading } = useGetOsAtrasadas();

  const statCards = [
    { label: "Vendas", value: stats?.totalVendas ?? 0, icon: ShoppingCart, href: "/vendas", color: "text-blue-600" },
    { label: "Orçamentos", value: stats?.totalOrcamentos ?? 0, icon: FileText, href: "/orcamentos", color: "text-purple-600" },
    { label: "Ordens de Serviço", value: stats?.totalOs ?? 0, icon: ClipboardList, href: "/os", color: "text-orange-600" },
    { label: "Clientes", value: stats?.totalClientes ?? 0, icon: Users, href: "/cadastros/clientes", color: "text-green-600" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo, {user?.nome}. Aqui está o resumo do sistema.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <Link key={card.href} href={card.href} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{card.label}</p>
                        {statsLoading ? (
                          <Skeleton className="h-7 w-12 mt-1" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                        )}
                      </div>
                      <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>

        {/* Financial + OS summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-muted-foreground">Receita do Mês</p>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.receitaMes ?? 0)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-muted-foreground">OS Pendentes / Em Produção</p>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {stats?.osPendentes ?? 0} / {stats?.osEmProducao ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-muted-foreground">A Receber ({stats?.contasReceberPendentes ?? 0} parcelas)</p>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.contasReceberValor ?? 0)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OS por Status Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">OS por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {osStatusLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={osPorStatus?.map(d => ({ ...d, label: statusLabels[d.status] ?? d.status }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "OS"]} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Vendas Recentes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {vendasLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : vendasRecentes?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma venda registrada</p>
              ) : (
                <div className="space-y-2">
                  {vendasRecentes?.map(venda => (
                    <Link key={venda.id} href={`/vendas/${venda.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-foreground">{venda.numero}</p>
                          <p className="text-xs text-muted-foreground">{venda.cliente?.razaoSocial}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(venda.valorTotal)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(venda.dataVenda)}</p>
                        </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* OS em produção */}
        {(osAtrasadas?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                OS em Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atrasadasLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-2">
                  {osAtrasadas?.map(os => (
                    <Link key={os.id} href={`/os/${os.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${prioridadeColors[os.prioridade]}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{os.numero}</p>
                            <p className="text-xs text-muted-foreground">{os.cliente?.razaoSocial}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[os.etapaAtual] ?? "bg-muted text-muted-foreground"}`}>
                            {os.etapaAtual}
                          </span>
                          <p className="text-xs text-muted-foreground">{formatDate(os.dataInicio)}</p>
                        </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
