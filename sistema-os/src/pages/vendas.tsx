import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListVendas, useGerarOsParaVenda } from "@workspace/api-client-react";
import { getListVendasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, ClipboardPlus, ShoppingCart } from "lucide-react";

const statusColors: Record<string, string> = {
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  aguardando: "bg-yellow-100 text-yellow-800",
};
const statusLabels: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
  aguardando: "Aguardando",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  const dt = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}

export default function VendasPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data: vendas = [], isLoading } = useListVendas({ status: statusFilter || undefined });

  const gerarOsMut = useGerarOsParaVenda({
    mutation: {
      onSuccess: (os) => {
        toast({ title: `OS ${os.numero} criada!` });
        qc.invalidateQueries({ queryKey: getListVendasQueryKey() });
      },
      onError: () => toast({ title: "Erro ao gerar OS", variant: "destructive" }),
    },
  });

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Vendas</h1>
          </div>
          <Link href="/vendas/nova">
            <a><Button><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button></a>
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["", "em_andamento", "concluida", "cancelada"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s === "" ? "Todas" : statusLabels[s]}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : vendas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada</TableCell></TableRow>
                ) : vendas.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium">{v.numero}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-[140px]">{v.cliente?.razaoSocial ?? "—"}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(v.dataVenda)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {v.formaPagamento ?? "—"} {(v.numParcelas ?? 0) > 1 ? `(${v.numParcelas}x)` : ""}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(v.valorTotal)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[v.status] ?? "bg-muted text-muted-foreground"}`}>
                        {statusLabels[v.status] ?? v.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/vendas/${v.id}`}>
                          <a><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></a>
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          title="Gerar OS"
                          onClick={() => gerarOsMut.mutate({ id: v.id })}
                        >
                          <ClipboardPlus className="h-4 w-4 text-orange-600" />
                        </Button>
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
