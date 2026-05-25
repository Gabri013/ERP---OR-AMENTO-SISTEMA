import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListContasReceber, pagarContaReceber, getListContasReceberQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownCircle, CheckCircle } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  const dt = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}

const FORMAS = ["pix", "boleto", "cartao_credito", "dinheiro", "transferencia"];

export default function ContasReceberPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [pagarOpen, setPagarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [pagarForm, setPagarForm] = useState({ valorPago: "", formaPagamento: "pix", observacao: "" });

  const { data: contas = [], isLoading } = useListContasReceber({ status: statusFilter || undefined });

  const pagarMut = useMutation({
    mutationFn: (data: { id: number; valorPago: number; formaPagamento: string; observacao?: string }) =>
      pagarContaReceber(data.id, { valorPago: data.valorPago, formaPagamento: data.formaPagamento, observacao: data.observacao }),
    onSuccess: () => {
      toast({ title: "Pagamento registrado!" });
      qc.invalidateQueries({ queryKey: getListContasReceberQueryKey() });
      setPagarOpen(false);
    },
    onError: () => toast({ title: "Erro ao registrar pagamento", variant: "destructive" }),
  });

  const openPagar = (id: number, valor: number) => {
    setSelectedId(id);
    setPagarForm({ valorPago: String(valor), formaPagamento: "pix", observacao: "" });
    setPagarOpen(true);
  };

  const handlePagar = (e: React.FormEvent) => {
    e.preventDefault();
    pagarMut.mutate({ id: selectedId, valorPago: parseFloat(pagarForm.valorPago) || 0, formaPagamento: pagarForm.formaPagamento, observacao: pagarForm.observacao || undefined });
  };

  const isVencida = (dataVenc: string) => new Date(dataVenc) < new Date();

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Contas a Receber</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["", "PENDENTE", "PAGO", "CANCELADO"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s === "" ? "Todas" : s}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : contas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
                ) : contas.map(c => {
                  const vencida = c.status === "PENDENTE" && isVencida(c.dataVencimento);
                  return (
                    <TableRow key={c.id} className={vencida ? "bg-red-50" : ""}>
                      <TableCell>
                        <p className="font-medium">{c.cliente?.razaoSocial ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.formaPagamento}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.parcelaNumero}/{c.totalParcelas}
                      </TableCell>
                      <TableCell className={`hidden md:table-cell text-sm ${vencida ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {formatDate(c.dataVencimento)}
                        {vencida && " ⚠️"}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(c.valorLiquido)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "PAGO" ? "bg-green-100 text-green-800" : c.status === "PENDENTE" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.status === "PENDENTE" && (
                          <Button variant="ghost" size="icon" title="Registrar Pagamento" onClick={() => openPagar(c.id, c.valorLiquido)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
            <form onSubmit={handlePagar} className="space-y-4">
              <div>
                <Label>Valor Pago (R$)</Label>
                <Input type="number" step="0.01" min="0" value={pagarForm.valorPago} onChange={e => setPagarForm(p => ({ ...p, valorPago: e.target.value }))} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pagarForm.formaPagamento} onChange={e => setPagarForm(p => ({ ...p, formaPagamento: e.target.value }))}>
                  {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={pagarForm.observacao} onChange={e => setPagarForm(p => ({ ...p, observacao: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPagarOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={pagarMut.isPending}>Confirmar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
