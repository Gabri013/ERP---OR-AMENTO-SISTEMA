import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  ClipboardList,
  Clock3,
  Cog,
  Factory,
  FileBadge,
  Gauge,
  PackageCheck,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { KpiMetricCard } from "@/components/industrial/KpiMetricCard";
import { ProductionKanban } from "@/components/industrial/ProductionKanban";
import { StatusPill } from "@/components/industrial/StatusPill";
import { IndustrialDataTable } from "@/components/industrial/IndustrialDataTable";
import { useIndustrialDashboard } from "@/hooks/useIndustrial";

const flowIcons = [FileBadge, BadgeDollarSign, ClipboardList, Cog, CalendarClock, Factory, PackageCheck];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useIndustrialDashboard();

  const sectors = data?.sectors ?? [];
  const operators = data?.operatorRanking ?? [];
  const orders = data?.serviceOrders ?? [];
  const weeklyProduction = data?.weeklyProduction ?? [];
  const cashflow = data?.cashflow ?? [];
  const recentRows = data?.recentRows ?? [];
  const slaData = [
    { name: "No prazo", value: data?.sla?.onTime ?? 0, color: "#15803D" },
    { name: "Atencao", value: data?.sla?.attention ?? 0, color: "#EA580C" },
    { name: "Atrasado", value: data?.sla?.late ?? 0, color: "#DC2626" },
  ];

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6">
        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#003D7A]">Operacao industrial em tempo real</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">ERP Cozinca Industrial Enterprise</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Todos os indicadores abaixo são lidos do PostgreSQL via API industrial.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[6px] border border-slate-200 px-4 py-3">
                <p className="text-[11px] text-slate-500">Status</p>
                <p className="font-black text-slate-950">{isLoading ? "Lendo" : isError ? "Erro" : "Online"}</p>
              </div>
              <div className="rounded-[6px] border border-slate-200 px-4 py-3">
                <p className="text-[11px] text-slate-500">Setores</p>
                <p className="font-black text-slate-950">{sectors.length}</p>
              </div>
              <div className="rounded-[6px] border border-slate-200 px-4 py-3">
                <p className="text-[11px] text-slate-500">O.S.</p>
                <p className="font-black text-emerald-600">{orders.length}</p>
              </div>
            </div>
          </div>
        </section>

        {isError && (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Nao foi possivel consultar a API industrial. Nenhum dado local foi usado.
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiMetricCard title="O.S. em andamento" value={String(data?.osInProgress ?? 0)} detail="carteira industrial ativa" icon={Factory} />
          <KpiMetricCard title="Producao do dia" value={`${data?.productionToday ?? 0} apont.`} detail="apontamentos sincronizados" icon={PackageCheck} accent="#15803D" />
          <KpiMetricCard title="Gargalos" value={data?.bottlenecks?.[0]?.sector ?? "0"} detail="setor com maior carga" icon={AlertTriangle} accent="#EA580C" />
          <KpiMetricCard title="Tempo medio" value={`${data?.averageTimeMinutes ?? 0}m`} detail="por operacao apontada" icon={Clock3} accent="#0E7490" />
          <KpiMetricCard title="Faturamento" value={formatCurrency(data?.revenue ?? 0)} detail="vendas no banco" icon={BadgeDollarSign} accent="#15803D" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr_0.8fr]">
          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Producao semanal</h3>
                <p className="text-xs text-slate-500">Apontamentos reais dos ultimos 7 dias.</p>
              </div>
              <StatusPill tone="ok">Banco de dados</StatusPill>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyProduction}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="planejado" fill="#E0E9FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="produzido" fill="#003D7A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retrabalho" fill="#EA580C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-950">Faturamento e custo</h3>
              <p className="text-xs text-slate-500">Agrupado pelas vendas gravadas.</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="receita" stroke="#003D7A" fill="#E0E9FF" strokeWidth={2} />
                <Area type="monotone" dataKey="custo" stroke="#94A3B8" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-950">SLA de entrega</h3>
              <p className="text-xs text-slate-500">Calculado pelas datas das O.S.</p>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={slaData} innerRadius={58} outerRadius={86} paddingAngle={4} dataKey="value">
                  {slaData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {slaData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Carga de setores fabris</h3>
                <p className="text-xs text-slate-500">Capacidade e carga gravadas em `CapacidadeSetor`.</p>
              </div>
              <Gauge className="h-5 w-5 text-[#003D7A]" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {sectors.map((sector: any) => (
                <motion.div key={sector.sector} whileHover={{ y: -2 }} className="rounded-[6px] border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-950">{sector.sector}</p>
                    <StatusPill tone={sector.status}>{sector.status}</StatusPill>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(sector.capacity, 120)}%`,
                        backgroundColor: sector.capacity > 100 ? "#EA580C" : "#003D7A",
                      }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-500">Carga: <b className="text-slate-900">{sector.plannedMinutes}m</b></span>
                    <span className="text-slate-500">Cap.: <b className="text-slate-900">{sector.availableMinutes}m</b></span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Ranking operadores</h3>
                <p className="text-xs text-slate-500">Apontamentos reais do dia.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-3">
              {operators.length === 0 && <p className="text-sm text-slate-500">Sem apontamentos no banco hoje.</p>}
              {operators.map((operator: any, index: number) => (
                <div key={operator.name} className="flex items-center justify-between rounded-[6px] border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E0E9FF] text-xs font-black text-[#003D7A]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{operator.name}</p>
                      <p className="text-xs text-slate-500">{operator.sector} - {operator.appointments} apont.</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-emerald-600">{operator.minutes}m</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Fluxo fabril completo</h3>
              <p className="text-xs text-slate-500">Contagens vindas das tabelas de orçamento, venda, O.S., PCP e etiquetas.</p>
            </div>
            <RotateCcw className="h-5 w-5 text-[#003D7A]" />
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            {(data?.flow ?? []).map((step: any, index: number) => {
              const Icon = flowIcons[index] ?? Factory;
              return (
                <div key={step.label} className="relative rounded-[6px] border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-[#003D7A]" />
                    <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-950">{step.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{step.count} registros ativos</p>
                </div>
              );
            })}
          </div>
        </section>

        <ProductionKanban orders={orders} />

        <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <IndustrialDataTable title="Ordens, requisicoes e alertas recentes" rows={recentRows} />
          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950">Rastreabilidade critica</h3>
            <p className="text-xs text-slate-500">O.S. lidas do banco com setor atual e status.</p>
            <div className="mt-4 space-y-3">
              {orders.slice(0, 4).map((order: any) => (
                <div key={order.id} className="rounded-[6px] border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#003D7A]">{order.number}</p>
                    <StatusPill tone={order.priority}>{order.priority}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900">{order.product}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className="text-slate-500">Setor: <b className="text-slate-900">{order.currentSector}</b></span>
                    <span className="text-slate-500">Status: <b className="text-slate-900">{order.status}</b></span>
                    <span className="text-slate-500">Prog.: <b className="text-slate-900">{order.progress}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
