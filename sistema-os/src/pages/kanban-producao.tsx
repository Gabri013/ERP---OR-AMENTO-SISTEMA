import { useState } from "react";
import { Layout } from "@/components/layout";
import { KanbanBoard, type KanbanCardData, type KanbanColumn } from "@/components/KanbanBoard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Factory } from "lucide-react";
import { api } from "@/lib/api";

const COLUMNS_CONFIG: Array<{ id: string; label: string; color: string; bgColor: string }> = [
  { id: "pendente",    label: "Aguardando",   color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  { id: "liberada",   label: "Liberada",     color: "text-sky-400",    bgColor: "bg-sky-500/10 border-sky-500/20" },
  { id: "em_producao",label: "Em Produção",  color: "text-blue-400",   bgColor: "bg-blue-500/10 border-blue-500/20" },
  { id: "pausado",    label: "Pausada",      color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  { id: "em_revisao", label: "Revisão",      color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
  { id: "concluida",  label: "Finalizada",   color: "text-green-400",  bgColor: "bg-green-500/10 border-green-500/20" },
  { id: "entregue",   label: "Entregue",     color: "text-teal-400",   bgColor: "bg-teal-500/10 border-teal-500/20" },
  { id: "cancelada",  label: "Cancelada",    color: "text-red-400",    bgColor: "bg-red-500/10 border-red-500/20" },
];

export default function KanbanProducaoPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: kanbanData, isLoading, refetch } = useQuery({
    queryKey: ["kanban-producao"],
    queryFn: () => api.get("/kanban/producao").then((r) => r.data?.data ?? r.data),
    refetchInterval: 30000,
  });

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/os/${id}/kanban`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban-producao"] });
      toast({ title: "OS movida com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao mover OS", variant: "destructive" }),
  });

  const columns: KanbanColumn[] = COLUMNS_CONFIG.map((cfg) => {
    const allItems: KanbanCardData[] = kanbanData?.[cfg.id] ?? [];
    const filtered = search
      ? allItems.filter(
          (i) =>
            i.numero.toLowerCase().includes(search.toLowerCase()) ||
            i.clienteNome.toLowerCase().includes(search.toLowerCase()),
        )
      : allItems;
    return { ...cfg, items: filtered };
  });

  const total = columns.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Kanban de Produção</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {total} OS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar OS ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-full sm:w-56 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-hidden px-4 py-4 sm:px-6">
          <KanbanBoard
            columns={columns}
            isLoading={isLoading}
            onMove={(id, from, to) => moveMut.mutate({ id, status: to })}
            detailPath={(id) => `/os/${id}`}
          />
        </div>
      </div>
    </Layout>
  );
}
