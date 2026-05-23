import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListContasPagar, createContaPagar, pagarContaPagar, getListContasPagarQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, Plus, CheckCircle } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function ContasPagarPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descricao: "", fornecedor: "", valor: "", dataVencimento: "" });

  const { data: contas = [], isLoading } = useListContasPagar({ status: statusFilter || undefined });

  const createMut = useMutation({
    mutationFn: (data: any) => createContaPagar(data),
    onSuccess: () => {
      toast({ title: "Conta criada!" });
      qc.invalidateQueries({ queryKey: getListContasPagarQueryKey() });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar conta", variant: "destructive" }),
  });

  const pagarMut = useMutation({
    mutationFn: (id: number) => pagarContaPagar(id),
    onSuccess: () => {
      toast({ title: "Conta paga!" });
      qc.invalidateQueries({ queryKey: getListContasPagarQueryKey() });
    },
    onError: () => toast({ title: "Erro ao registrar pagamento", variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.dataVencimento) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return;
    }
    createMut.mutate({ descricao: form.descricao, fornecedor: form.fornecedor || undefined, valor: parseFloat(form.valor), dataVencimento: form.dataVencimento });
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Contas a Pagar</h1>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["", "PENDENTE", "PAGO"].map(s => (
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
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
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
                  const vencida = c.status === "PENDENTE" && new Date(c.dataVencimento) < new Date();
                  return (
                    <TableRow key={c.id} className={vencida ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.fornecedor ?? "—"}</TableCell>
                      <TableCell className={`hidden md:table-cell text-sm ${vencida ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {formatDate(c.dataVencimento)}{vencida && " ⚠️"}
                      </TableCell>
                      <TableCell className="font-semibold text-red-700">{formatCurrency(c.valor)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "PAGO" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.status === "PENDENTE" && (
                          <Button variant="ghost" size="icon" onClick={() => pagarMut.mutate(c.id)}>
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Descrição *</Label><Input {...f("descricao")} /></div>
              <div><Label>Fornecedor</Label><Input {...f("fornecedor")} /></div>
              <div><Label>Valor (R$) *</Label><Input {...f("valor")} type="number" step="0.01" min="0" /></div>
              <div><Label>Data de Vencimento *</Label><Input {...f("dataVencimento")} type="date" /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMut.isPending}>Criar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
