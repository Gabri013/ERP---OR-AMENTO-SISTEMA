import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { IndustrialDataTable } from "@/components/industrial/IndustrialDataTable";
import { IndustrialLabelPreview } from "@/components/industrial/IndustrialLabelPreview";
import { KpiMetricCard } from "@/components/industrial/KpiMetricCard";
import { ProductionKanban } from "@/components/industrial/ProductionKanban";
import { StatusPill } from "@/components/industrial/StatusPill";
import { industrialModules } from "@/modules/industrial/modules";
import type { ModuleKey } from "@/types/industrial";
import {
  useIndustrialDashboard,
  useIndustrialModuleRows,
  useIndustrialOrders,
} from "@/hooks/useIndustrial";

const moduleActions: Partial<Record<ModuleKey, string>> = {
  comercial: "Nova oportunidade",
  orcamentos: "Novo orcamento",
  vendas: "Novo pedido",
  engenharia: "Nova revisao",
  "estrutura-produto": "Nova estrutura",
  producao: "Nova O.S.",
  pcp: "Sequenciar semana",
  estoque: "Nova movimentacao",
  compras: "Nova cotacao",
  financeiro: "Novo lancamento",
  rh: "Novo operador",
  qualidade: "Nova inspecao",
  "assistencia-tecnica": "Novo chamado",
  "usuarios-permissoes": "Novo usuario",
  configuracoes: "Novo parametro",
  etiquetas: "Imprimir lote",
};

export function EnterpriseModulePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const module = industrialModules.find((item) => item.key === moduleKey) ?? industrialModules[0];
  const Icon = module.icon;
  const { data: liveOrders } = useIndustrialOrders();
  const { data: dashboard } = useIndustrialDashboard();
  const { data: rows = [], isError } = useIndustrialModuleRows(moduleKey);
  const isFlow = moduleKey === "fluxo-producao" || moduleKey === "producao";
  const isLabels = moduleKey === "etiquetas";

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6 overflow-x-hidden">
        <section className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border"
                style={{
                  color: module.accent,
                  backgroundColor: `${module.accent}12`,
                  borderColor: `${module.accent}24`,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#003D7A]">{module.group}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{module.title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">{module.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiMetricCard title="Registros ativos" value={String(rows.length)} detail="Registros lidos do banco" icon={Activity} accent={module.accent} />
          <KpiMetricCard title="O.S. andamento" value={String(dashboard?.osInProgress ?? 0)} detail="Tabela OrdemServico" icon={Clock3} accent="#15803D" />
          <KpiMetricCard title="Pendencias" value={String(dashboard?.qualityPending ?? 0)} detail="Qualidade/inspecoes" icon={Gauge} accent="#EA580C" />
          <KpiMetricCard title="Etiquetas" value={String(dashboard?.labelsCount ?? 0)} detail="Tabela EtiquetaIndustrial" icon={ShieldCheck} accent="#003D7A" />
        </section>

        {isError && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Falha ao consultar este modulo no banco. Nenhum dado local foi exibido.
          </div>
        )}

        {moduleKey === "pcp" && (
          <section className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Planejamento semanal e capacidade produtiva</h3>
                <p className="text-xs text-slate-500">Carga maquina, sequenciamento, gargalos, prioridades e calendario fabril.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-[#003D7A]" />
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {(dashboard?.sectors ?? []).map((sector: any) => (
                <div key={sector.sector} className="rounded-[6px] border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{sector.sector}</p>
                    <StatusPill tone={sector.status}>{sector.status}</StatusPill>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#003D7A]" style={{ width: `${Math.min(sector.capacity, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{sector.plannedMinutes}m planejados - {sector.capacity}% carga</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {isFlow && (
          <section className="space-y-4">
            <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Fluxo industrial sob encomenda</h3>
                  <p className="text-xs text-slate-500">Cada O.S. possui etapas, tempos, setores, status, QR Code e rastreabilidade.</p>
                </div>
                <BarChart3 className="h-5 w-5 text-[#003D7A]" />
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {(dashboard?.flow ?? []).map((step: any) => {
                  return (
                    <div key={step.label} className="rounded-[6px] border border-slate-200 p-3">
                      <BarChart3 className="h-5 w-5 text-[#003D7A]" />
                      <p className="mt-3 text-sm font-bold text-slate-950">{step.label}</p>
                      <p className="text-xs text-slate-500">{step.count} ativos</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <ProductionKanban orders={liveOrders ?? []} />
          </section>
        )}

        {isLabels && <IndustrialLabelPreview orders={liveOrders ?? []} />}

        <section className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_360px]">
          <IndustrialDataTable title={`${module.title} - tabela operacional enterprise`} rows={rows} />
          <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Controles do modulo</h3>
                <p className="text-xs text-slate-500">Componentes reutilizaveis e prontos para API.</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-3 text-sm">
              {[
                "API separada por dominio",
                "React Query para sincronizacao",
                "React Hook Form + Zod nos formularios",
                "Auditoria e permissoes por modulo",
                "Exportacao Excel/PDF",
                "Socket.io para atualizacao em tempo real",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-[6px] border border-slate-100 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full rounded-[6px]">
              <Link href="/">Voltar ao dashboard executivo</Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default EnterpriseModulePage;
