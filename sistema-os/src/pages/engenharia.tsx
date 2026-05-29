import { Layout } from "@/components/layout";
import { useListOS } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Eye, AlertTriangle, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

const etapaLabels: Record<string, string> = {
  autorizacao: "Autorização", engenharia: "Engenharia", programacao: "Programação",
  corte: "Corte", dobra: "Dobra", tubo: "Tubo", solda: "Solda",
  coccao: "Cocção", refrigeracao: "Refrigeração", mobiliario: "Mobiliário",
  montagem: "Montagem", revisao: "Revisão", embalagem: "Embalagem", expedicao: "Expedição",
  concluida: "Concluída",
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function EngenhariaPage() {
  const hoje = new Date();

  const { data: allOS = [], isLoading } = useListOS();
  const osList = Array.isArray(allOS) ? allOS : [];

  const fila = osList.filter((os: any) =>
    ["autorizacao", "engenharia", "programacao", "em_projeto", "em_revisao"].includes(
      os.etapaAtual ?? os.status,
    ),
  );

  const atrasadas = fila.filter(
    (os: any) => os.dataTermino && new Date(os.dataTermino) < hoje,
  );

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Fila de Engenharia</h1>
          <Badge variant="secondary">{fila.length} OS</Badge>
          {atrasadas.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {atrasadas.length} atrasadas
            </Badge>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Total na fila", value: fila.length, color: "text-primary" },
            { label: "Atrasadas", value: atrasadas.length, color: "text-red-500" },
            { label: "Hoje", value: fila.filter((o: any) => o.dataTermino && new Date(o.dataTermino).toDateString() === hoje.toDateString()).length, color: "text-yellow-500" },
            { label: "Concluídas", value: osList.filter((o: any) => o.status === "concluida" || o.etapaAtual === "concluida").length, color: "text-green-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-[12px]">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queue table */}
        <Card className="rounded-[12px]">
          <CardHeader>
            <CardTitle className="text-sm">OS em espera de Engenharia/Programação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : fila.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma OS na fila</div>
            ) : (
              <div className="divide-y">
                {fila.map((os: any) => {
                  const isAtrasada = os.dataTermino && new Date(os.dataTermino) < hoje;
                  return (
                    <div
                      key={os.id}
                      className={`flex flex-col gap-3 px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between ${isAtrasada ? "bg-red-500/5" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${os.prioridade === "vermelho" ? "bg-red-500" : os.prioridade === "amarelo" ? "bg-yellow-500" : "bg-green-500"}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm">{os.numero}</span>
                            {isAtrasada && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{os.cliente?.razaoSocial ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={os.etapaAtual ?? os.status} />
                        <span className={`text-xs ${isAtrasada ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {formatDate(os.dataTermino)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/os/${os.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
