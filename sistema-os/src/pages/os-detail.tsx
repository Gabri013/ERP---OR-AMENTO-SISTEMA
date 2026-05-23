import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useGetOS, useAvancarEtapaOS, addObservacaoOS } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const ETAPAS = ["autorizacao","corte","dobra","solda","acabamento","finalizacao","montagem","concluida"];
const etapaLabels: Record<string, string> = {
  autorizacao: "Autorização", corte: "Corte", dobra: "Dobra", solda: "Solda",
  acabamento: "Acabamento", finalizacao: "Finalização", montagem: "Montagem", concluida: "Concluída",
};

const prioridadeBg: Record<string, string> = {
  verde: "bg-green-500", amarelo: "bg-yellow-500", vermelho: "bg-red-500",
};
const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800", em_producao: "bg-orange-100 text-orange-800",
  concluida: "bg-green-100 text-green-800", cancelada: "bg-red-100 text-red-800",
};
const statusLabels: Record<string, string> = {
  pendente: "Pendente", em_producao: "Em Produção", concluida: "Concluída", cancelada: "Cancelada",
};

function formatDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); }
function formatDateTime(d: string) { return new Date(d).toLocaleString("pt-BR"); }

export default function OSDetailPage() {
  const [, params] = useRoute("/os/:id");
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const id = parseInt(params?.id ?? "0");

  const { data: os, isLoading } = useGetOS(id);
  const [obsText, setObsText] = useState("");
  const [obsSending, setObsSending] = useState(false);

  const avancarMut = useAvancarEtapaOS({
    mutation: {
      onSuccess: () => { toast({ title: "Etapa avançada!" }); qc.invalidateQueries(); },
      onError: () => toast({ title: "Erro ao avançar etapa", variant: "destructive" }),
    },
  });

  const addObsMut = useMutation({
    mutationFn: (data: { osId: number; observacao: string; tipoSetor: string }) =>
      addObservacaoOS(data.osId, { observacao: data.observacao, tipoSetor: data.tipoSetor }),
    onSuccess: () => {
      toast({ title: "Observação adicionada!" });
      setObsText("");
      qc.invalidateQueries();
    },
    onError: () => toast({ title: "Erro ao adicionar observação", variant: "destructive" }),
  });

  const handleAddObs = () => {
    if (!obsText.trim()) return;
    addObsMut.mutate({ osId: id, observacao: obsText, tipoSetor: user?.tipo ?? "geral" });
  };

  const nextEtapa = () => {
    const idx = ETAPAS.indexOf(os?.etapaAtual ?? "");
    return idx >= 0 && idx < ETAPAS.length - 1 ? ETAPAS[idx + 1] : null;
  };

  if (isLoading) return <Layout><div className="p-6 text-muted-foreground">Carregando...</div></Layout>;
  if (!os) return <Layout><div className="p-6 text-muted-foreground">OS não encontrada.</div></Layout>;

  const next = nextEtapa();

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link href="/os"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${prioridadeBg[os.prioridade]}`} />
              <div>
                <h1 className="text-xl font-bold font-mono">{os.numero}</h1>
                <p className="text-sm text-muted-foreground">Ordem de Serviço</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[os.status] ?? "bg-muted"}`}>
              {statusLabels[os.status] ?? os.status}
            </span>
          </div>
          {next && (
            <Button onClick={() => avancarMut.mutate({ id: os.id, data: { novaEtapa: next } })} disabled={avancarMut.isPending}>
              <ChevronRight className="h-4 w-4 mr-1" />
              Avançar para {etapaLabels[next]}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {ETAPAS.map((e, i) => {
                const currentIdx = ETAPAS.indexOf(os.etapaAtual);
                const done = i < currentIdx;
                const active = e === os.etapaAtual;
                return (
                  <div key={e} className="flex-1 min-w-[70px] text-center">
                    <div className={`h-2 rounded-full mb-1 ${done ? "bg-green-500" : active ? "bg-primary" : "bg-muted"}`} />
                    <p className={`text-xs font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                      {etapaLabels[e]}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{os.cliente?.razaoSocial}</p>
              {os.cliente?.cnpjCpf && <p className="text-sm text-muted-foreground">CNPJ/CPF: {os.cliente.cnpjCpf}</p>}
              {os.cliente?.telefone && <p className="text-sm text-muted-foreground">Tel: {os.cliente.telefone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Datas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Início</span><span>{formatDate(os.dataInicio)}</span></div>
              {os.dataTermino && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Termino</span><span>{formatDate(os.dataTermino)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Prioridade</span><span className="capitalize">{os.prioridade}</span></div>
            </CardContent>
          </Card>
        </div>

        {os.observacoesGerais && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Observações Gerais</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{os.observacoesGerais}</p></CardContent>
          </Card>
        )}

        {/* Historico */}
        {(os as any).historico?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico de Etapas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(os as any).historico.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <span className="text-muted-foreground text-xs whitespace-nowrap mt-0.5">{formatDateTime(h.createdAt)}</span>
                    <div>
                      <span className="font-medium">{h.statusNovo}</span>
                      {h.statusAnterior && <span className="text-muted-foreground"> (de: {h.statusAnterior})</span>}
                      {h.observacao && <p className="text-muted-foreground text-xs">{h.observacao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Observações / Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(os as any).observacoes?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem observações</p>
              ) : (os as any).observacoes?.map((obs: any) => (
                <div key={obs.id} className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{obs.usuario?.nome ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(obs.createdAt)}</span>
                  </div>
                  <p className="text-sm">{obs.observacao}</p>
                  {obs.tipoSetor && <Badge variant="outline" className="mt-1 text-xs">{obs.tipoSetor}</Badge>}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Adicionar observação..."
                value={obsText}
                onChange={e => setObsText(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={handleAddObs} disabled={addObsMut.isPending || !obsText.trim()}>
                Enviar Observação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
