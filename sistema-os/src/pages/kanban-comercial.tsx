import { useState } from "react";
import { Layout } from "@/components/layout";
import { KanbanBoard, type KanbanCardData, type KanbanColumn } from "@/components/KanbanBoard";
import { useListOrcamentos } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const COMMERCIAL_COLUMNS: Array<{ id: string; label: string; color: string; bgColor: string; statuses: string[] }> = [
  { id: "pendente",    label: "Proposta",    color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20",  statuses: ["pendente"] },
  { id: "em_projeto",  label: "Elaboração",  color: "text-blue-400",   bgColor: "bg-blue-500/10 border-blue-500/20",      statuses: ["em_projeto"] },
  { id: "em_revisao",  label: "Negociação",  color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20",  statuses: ["em_revisao", "em_producao"] },
  { id: "convertido",  label: "Convertido",  color: "text-teal-400",   bgColor: "bg-teal-500/10 border-teal-500/20",      statuses: ["convertido"] },
  { id: "concluida",   label: "Aprovado",    color: "text-green-400",  bgColor: "bg-green-500/10 border-green-500/20",    statuses: ["concluida"] },
  { id: "cancelada",   label: "Perdido",     color: "text-red-400",    bgColor: "bg-red-500/10 border-red-500/20",        statuses: ["cancelada"] },
];

export default function KanbanComercialPage() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: orcamentosRaw = [], isLoading, refetch } = useListOrcamentos();
  const orcamentos: any[] = Array.isArray(orcamentosRaw) ? orcamentosRaw : [];

  const columns: KanbanColumn[] = COMMERCIAL_COLUMNS.map((cfg) => {
    const items: KanbanCardData[] = orcamentos
      .filter((o: any) => cfg.statuses.includes(o.status))
      .filter((o: any) =>
        !search ||
        o.numero?.toLowerCase().includes(search.toLowerCase()) ||
        o.cliente?.razaoSocial?.toLowerCase().includes(search.toLowerCase()),
      )
      .map((o: any) => ({
        id: o.id,
        numero: o.numero,
        clienteNome: o.cliente?.razaoSocial ?? "—",
        status: cfg.id,
        prioridade: "verde",
        dataTermino: o.validade,
        atrasada: o.validade ? new Date(o.validade) < new Date() : false,
        meta: { valorTotal: o.valorTotal, status: o.status },
      }));
    return { ...cfg, items };
  });

  const total = orcamentos.length;

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Kanban Comercial</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {total} orçamentos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar orçamento ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-56 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <KanbanBoard
            columns={columns}
            isLoading={isLoading}
            detailPath={(id) => `/orcamentos/${id}`}
            cardExtra={(item) =>
              item.meta?.valorTotal ? (
                <p className="text-xs font-semibold text-green-500">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    item.meta.valorTotal,
                  )}
                </p>
              ) : null
            }
          />
        </div>
      </div>
    </Layout>
  );
}
