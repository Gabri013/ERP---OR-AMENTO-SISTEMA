import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetDashboardStats,
  useGetOsPorStatus,
  useGetOsAtrasadas,
  useGetVendasRecentes,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Package,
  FileText,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

function formatCurrency(v: number | null) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: number | null;
  color?: string;
}

function KpiCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "text-primary",
}: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend !== null && trend !== undefined && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}% vs mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const tipo = user?.tipo ?? "";

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: osPorStatus, isLoading: osStatusLoading } = useGetOsPorStatus();
  const { data: osAtrasadas } = useGetOsAtrasadas();
  const { data: vendasRecentes } = useGetVendasRecentes();

  const isGestao = ["master", "gerente"].includes(tipo);
  const isFinanceiro = tipo === "financeiro";
  const isVendedor = tipo === "vendedor";
  const isProducao = [
    "producao",
    "engenharia",
    "dashboard_producao",
    "corte",
    "dobra",
    "solda",
    "refrigeracao",
    "acabamento",
    "finalizacao",
    "montagem",
    "projetista",
  ].includes(tipo);

  if (statsLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const s = stats ?? {};

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isGestao
              ? "Dashboard Gerencial"
              : isFinanceiro
                ? "Dashboard Financeiro"
                : isVendedor
                  ? "Meu Painel"
                  : isProducao
                    ? "Painel de Produção"
                    : "Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo, {user?.nome}
          </p>
        </div>

        {/* KPIs - Gestão */}
        {isGestao && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Faturamento Mês"
              value={formatCurrency(s.receitaMes)}
              icon={<DollarSign className="h-4 w-4" />}
              trend={s.crescimentoReceita}
              color="text-green-500"
            />
            <KpiCard
              title="Total Vendas"
              value={s.totalVendas ?? 0}
              icon={<TrendingUp className="h-4 w-4" />}
              subtitle={`${s.totalOrcamentos ?? 0} orçamentos`}
            />
            <KpiCard
              title="OS em Produção"
              value={s.osEmProducao ?? 0}
              icon={<Clock className="h-4 w-4" />}
              subtitle={`${s.osPendentes ?? 0} pendentes`}
              color="text-blue-500"
            />
            <KpiCard
              title="OS Atrasadas"
              value={s.osAtrasadas ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              subtitle="Requerem atenção"
              color={s.osAtrasadas > 0 ? "text-red-500" : "text-green-500"}
            />
          </div>
        )}

        {/* KPIs secundários - Gestão */}
        {isGestao && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Clientes"
              value={s.totalClientes ?? 0}
              icon={<Users className="h-4 w-4" />}
            />
            <KpiCard
              title="Contas a Receber"
              value={formatCurrency(s.contasReceberValor)}
              icon={<DollarSign className="h-4 w-4" />}
              subtitle={`${s.contasReceberPendentes ?? 0} pendentes`}
              color="text-orange-500"
            />
            <KpiCard
              title="Recebido no Mês"
              value={formatCurrency(s.valorRecebidoMes)}
              icon={<CheckCircle className="h-4 w-4" />}
              color="text-green-500"
            />
            <KpiCard
              title="Taxa Conversão"
              value={`${s.taxaConversao ?? 0}%`}
              icon={<FileText className="h-4 w-4" />}
              subtitle="Orçamentos → Vendas"
            />
          </div>
        )}

        {/* KPIs - Financeiro */}
        {isFinanceiro && !isGestao && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Faturamento Mês"
              value={formatCurrency(s.receitaMes)}
              icon={<DollarSign className="h-4 w-4" />}
              trend={s.crescimentoReceita}
              color="text-green-500"
            />
            <KpiCard
              title="Contas a Receber"
              value={formatCurrency(s.contasReceberValor)}
              icon={<DollarSign className="h-4 w-4" />}
              subtitle={`${s.contasReceberPendentes ?? 0} pendentes • ${s.contasReceberAtrasadas ?? 0} atrasadas`}
              color="text-orange-500"
            />
            <KpiCard
              title="Recebido no Mês"
              value={formatCurrency(s.valorRecebidoMes)}
              icon={<CheckCircle className="h-4 w-4" />}
              color="text-green-500"
            />
          </div>
        )}

        {/* KPIs - Vendedor */}
        {isVendedor && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Minhas Vendas"
              value={s.totalVendas ?? 0}
              icon={<TrendingUp className="h-4 w-4" />}
              subtitle={formatCurrency(s.receitaMes)}
              color="text-green-500"
            />
            <KpiCard
              title="Meus Orçamentos"
              value={s.totalOrcamentos ?? 0}
              icon={<FileText className="h-4 w-4" />}
              subtitle={`${s.taxaConversao ?? 0}% convertidos`}
            />
            <KpiCard
              title="Total Clientes"
              value={s.totalClientes ?? 0}
              icon={<Users className="h-4 w-4" />}
            />
          </div>
        )}

        {/* KPIs - Produção */}
        {isProducao && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="OS em Produção"
              value={s.osEmProducao ?? 0}
              icon={<Clock className="h-4 w-4" />}
              color="text-blue-500"
            />
            <KpiCard
              title="OS Pendentes"
              value={s.osPendentes ?? 0}
              icon={<Package className="h-4 w-4" />}
              color="text-yellow-500"
            />
            <KpiCard
              title="OS Concluídas"
              value={s.osConcluidas ?? 0}
              icon={<CheckCircle className="h-4 w-4" />}
              color="text-green-500"
            />
            <KpiCard
              title="OS Atrasadas"
              value={s.osAtrasadas ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              color={s.osAtrasadas > 0 ? "text-red-500" : "text-green-500"}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {!isFinanceiro && osPorStatus && !osStatusLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  OS por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={osPorStatus}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(isGestao || isFinanceiro) && s.rankingVendedores && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Top Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {s.rankingVendedores.slice(0, 5).map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium">{v.nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-500">
                          {formatCurrency(v.valorTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.totalVendas} vendas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!isFinanceiro && osAtrasadas && osAtrasadas.length > 0 && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  OS em Produção / Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {osAtrasadas.slice(0, 5).map((os: any) => (
                    <div
                      key={os.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{os.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {os.cliente?.razaoSocial ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={os.etapaAtual ?? os.status} />
                        <span className="text-xs text-muted-foreground">
                          {os.dataTermino
                            ? new Date(os.dataTermino).toLocaleDateString(
                                "pt-BR",
                              )
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isVendedor && vendasRecentes && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Vendas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vendasRecentes.slice(0, 5).map((v: any) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{v.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.cliente?.razaoSocial ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(v.valorTotal)}
                        </p>
                        <StatusBadge status={v.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
