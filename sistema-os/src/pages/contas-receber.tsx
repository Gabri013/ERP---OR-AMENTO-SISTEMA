import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListContasReceber, pagarContaReceber, createContaReceber, updateContaReceber, deleteContaReceber, getListContasReceberQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownCircle, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const FORMAS = ["pix", "boleto", "cartao_credito", "dinheiro", "transferencia"];

export default function ContasReceberPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [pagarOpen, setPagarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [pagarForm, setPagarForm] = useState({ valorPago: "", formaPagamento: "pix", observacao: "" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ clienteId: "", valor: "", dataVencimento: "", formaPagamento: "pix", parcelaNumero: 1, totalParcelas: 1 });

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

  const createMut = useMutation({
    mutationFn: (data: any) => createContaReceber(data),
    onSuccess: () => {
      toast({ title: "Conta criada!" });
      qc.invalidateQueries({ queryKey: getListContasReceberQueryKey() });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar conta", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: any }) => updateContaReceber(data.id, data.body),
    onSuccess: () => {
      toast({ title: "Conta atualizada!" });
      qc.invalidateQueries({ queryKey: getListContasReceberQueryKey() });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteContaReceber(id),
    onSuccess: () => {
      toast({ title: "Conta removida!" });
      qc.invalidateQueries({ queryKey: getListContasReceberQueryKey() });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
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

  const openNew = () => {
    setEditing(null);
    setForm({ clienteId: "", valor: "", dataVencimento: "", formaPagamento: "pix", parcelaNumero: 1, totalParcelas: 1 });
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      clienteId: c.clienteId || "",
      valor: String(c.valorLiquido),
      dataVencimento: c.dataVencimento,
      formaPagamento: c.formaPagamento || "pix",
      parcelaNumero: c.parcelaNumero || 1,
      totalParcelas: c.totalParcelas || 1,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId || !form.valor || !form.dataVencimento) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const payload = {
      clienteId: parseInt(form.clienteId),
      valor: parseFloat(form.valor),
      dataVencimento: form.dataVencimento,
      formaPagamento: form.formaPagamento,
      parcelaNumero: form.parcelaNumero,
      totalParcelas: form.totalParcelas,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, body: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const isVencida = (dataVenc: string) => new Date(dataVenc) < new Date();

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Contas a Receber</h1>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>
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
                  <TableHead className="w-32">Ações</TableHead>
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
                    <TableRow key={c.id} className={vencida ? "bg-red-500/10" : ""}>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "PAGO" ? "bg-emerald-500/15 text-emerald-200" : c.status === "PENDENTE" ? "bg-amber-500/15 text-amber-200" : "bg-white/10 text-white/70"}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.status === "PENDENTE" && (
                            <Button variant="ghost" size="icon" title="Registrar Pagamento" onClick={() => openPagar(c.id, c.valorLiquido)}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir" onClick={() => deleteMut.mutate(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{editing ? "Editar Conta a Receber" : "Nova Conta a Receber"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>ID do Cliente *</Label>
                <Input {...f("clienteId")} type="number" />
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input {...f("valor")} type="number" step="0.01" min="0" />
              </div>
              <div>
                <Label>Data de Vencimento *</Label>
                <Input {...f("dataVencimento")} type="date" />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...f("formaPagamento")}>
                  {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Parcela</Label>
                  <Input {...f("parcelaNumero")} type="number" min="1" />
                </div>
                <div>
                  <Label>Total Parcelas</Label>
                  <Input {...f("totalParcelas")} type="number" min="1" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
