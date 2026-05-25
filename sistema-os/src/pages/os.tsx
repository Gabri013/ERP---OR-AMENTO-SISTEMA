import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListOS, useAvancarEtapaOS } from "@workspace/api-client-react";
import { getListOSQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, ClipboardList, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ETAPAS = ["autorizacao","corte","dobra","solda","refrigeracao","acabamento","finalizacao","montagem","concluida"];
const SECTOR_ROLES = ["corte","dobra","solda","refrigeracao","acabamento","finalizacao","montagem"];

const NEXT_ETAPA: Record<string, string> = {
  autorizacao: "corte",
  corte: "dobra",
  dobra: "solda",
  solda: "refrigeracao",
  refrigeracao: "acabamento",
  acabamento: "finalizacao",
  finalizacao: "montagem",
  montagem: "concluida",
};

const etapaLabels: Record<string, string> = {
  autorizacao: "Autorização", corte: "Corte", dobra: "Dobra", solda: "Solda",
  refrigeracao: "Refrigeração", acabamento: "Acabamento", finalizacao: "Finalização",
  montagem: "Montagem", concluida: "Concluída",
};

const etapaColors: Record<string, string> = {
  autorizacao: "bg-gray-100 text-gray-700",
  corte: "bg-blue-100 text-blue-700",
  dobra: "bg-violet-100 text-violet-700",
  solda: "bg-orange-100 text-orange-700",
  refrigeracao: "bg-cyan-100 text-cyan-700",
  acabamento: "bg-teal-100 text-teal-700",
  finalizacao: "bg-green-100 text-green-700",
  montagem: "bg-indigo-100 text-indigo-700",
  concluida: "bg-emerald-100 text-emerald-700",
};

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  em_projeto: "bg-blue-100 text-blue-800",
  em_revisao: "bg-purple-100 text-purple-800",
  em_producao: "bg-orange-100 text-orange-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};
const statusLabels: Record<string, string> = {
  pendente: "Pendente", em_projeto: "Em Projeto", em_revisao: "Em Revisão",
  em_producao: "Em Produção", concluida: "Concluída", cancelada: "Cancelada",
};
const prioridadeDot: Record<string, string> = {
  verde: "bg-green-500", amarelo: "bg-yellow-500", vermelho: "bg-red-500",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}

export default function OSPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("");

  const tipo = user?.tipo ?? "";
  const isSectorUser = SECTOR_ROLES.includes(tipo);
  const isReadOnly = tipo === "dashboard_producao";
  const canAdvance = isSectorUser || tipo === "master" || tipo === "gerente";

  const { data: osList = [], isLoading } = useListOS({
    status: statusFilter || undefined,
    etapa: etapaFilter || undefined,
  });

  const avancarMutation = useAvancarEtapaOS({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListOSQueryKey() });
        toast({ title: "Etapa avançada com sucesso!" });
      },
      onError: (err: any) => {
        toast({ title: "Erro ao avançar etapa", description: err?.response?.data?.error ?? "Erro desconhecido", variant: "destructive" });
      },
    },
  });

  function handleAvancar(osId: number, etapaAtual: string) {
    const novaEtapa = NEXT_ETAPA[etapaAtual];
    if (!novaEtapa) return;
    avancarMutation.mutate({ id: osId, data: { novaEtapa } });
  }

  const sectorLabel = isSectorUser ? etapaLabels[tipo] : null;

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Ordens de Serviço</h1>
            {sectorLabel && (
              <Badge variant="secondary" className="ml-2">Setor: {sectorLabel}</Badge>
            )}
          </div>
        </div>

        {!isSectorUser && (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground self-center">Status:</span>
              {["", ...Object.keys(statusLabels)].map(s => (
                <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                  {s === "" ? "Todos" : statusLabels[s]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground self-center">Etapa:</span>
              {["", ...ETAPAS].map(e => (
                <Button key={e} variant={etapaFilter === e ? "default" : "outline"} size="sm" onClick={() => setEtapaFilter(e)}>
                  {e === "" ? "Todas" : etapaLabels[e]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isSectorUser && (
          <p className="text-sm text-muted-foreground">
            Exibindo apenas as OS no setor de <strong>{sectorLabel}</strong> aguardando processamento.
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Término</TableHead>
                  <TableHead>Etapa Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : osList.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isSectorUser ? `Nenhuma OS aguardando no setor de ${sectorLabel}` : "Nenhuma OS encontrada"}
                  </TableCell></TableRow>
                ) : osList.map(os => (
                  <TableRow key={os.id}>
                    <TableCell>
                      <div className={`w-2.5 h-2.5 rounded-full ${prioridadeDot[os.prioridade] ?? "bg-gray-400"}`} title={os.prioridade} />
                    </TableCell>
                    <TableCell className="font-mono font-medium text-sm">{os.numero}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-[140px] text-sm">{os.cliente?.razaoSocial ?? "—"}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(os.dataTermino)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${etapaColors[os.etapaAtual] ?? "bg-muted text-muted-foreground"}`}>
                        {etapaLabels[os.etapaAtual] ?? os.etapaAtual}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[os.status] ?? "bg-muted text-muted-foreground"}`}>
                        {statusLabels[os.status] ?? os.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/os/${os.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canAdvance && NEXT_ETAPA[os.etapaAtual] && os.status !== "concluida" && os.status !== "cancelada" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={`Avançar para ${etapaLabels[NEXT_ETAPA[os.etapaAtual]]}`}
                            onClick={() => handleAvancar(os.id, os.etapaAtual)}
                            disabled={avancarMutation.isPending}
                          >
                            <ArrowRight className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
