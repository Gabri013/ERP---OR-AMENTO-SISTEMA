import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListOrcamentos, useConverterOrcamento } from "@workspace/api-client-react";
import { deleteOrcamento, getListOrcamentosQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Trash2, ArrowRightCircle, FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  convertido: "bg-blue-100 text-blue-800",
  expirado: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  convertido: "Convertido",
  expirado: "Expirado",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function OrcamentosPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data: orcamentos = [], isLoading } = useListOrcamentos({ status: statusFilter || undefined });

  const converterMut = useConverterOrcamento({
    mutation: {
      onSuccess: () => {
        toast({ title: "Orçamento convertido em venda!" });
        qc.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
      },
      onError: () => toast({ title: "Erro ao converter", variant: "destructive" }),
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteOrcamento(id),
    onSuccess: () => { toast({ title: "Orçamento removido!" }); qc.invalidateQueries({ queryKey: getListOrcamentosQueryKey() }); },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Orçamentos</h1>
          </div>
          <Link href="/orcamentos/novo">
            <a><Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Novo Orçamento</Button></a>
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["", "pendente", "aprovado", "convertido", "rejeitado"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "" ? "Todos" : statusLabels[s]}
            </Button>
          ))}
        </div>

        <Card className="rounded-[12px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="hidden md:table-cell">Validade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : orcamentos.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado</TableCell></TableRow>
                  ) : orcamentos.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-medium">{o.numero}</TableCell>
                      <TableCell>
                        <p className="font-medium truncate max-w-[160px]">{o.cliente?.razaoSocial ?? "—"}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(o.dataOrcamento)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{o.validade ? formatDate(o.validade) : "—"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(o.valorTotal)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-muted text-muted-foreground"}`}>
                          {statusLabels[o.status] ?? o.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/orcamentos/${o.id}`}>
                            <a><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></a>
                          </Link>
                          {o.status !== "convertido" && (
                            <Button
                              variant="ghost" size="icon"
                              title="Converter em Venda"
                              onClick={() => converterMut.mutate({ id: o.id })}
                            >
                              <ArrowRightCircle className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(o.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
