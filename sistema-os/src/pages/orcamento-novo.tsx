import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useListClientes, useListProdutos } from "@workspace/api-client-react";
import { createOrcamento, getListOrcamentosQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ItemRow {
  produtoId: number | null;
  descricaoManual: string;
  quantidade: string;
  valorUnitario: string;
}

const emptyItem = (): ItemRow => ({ produtoId: null, descricaoManual: "", quantidade: "1", valorUnitario: "0" });

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function OrcamentoNovoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clientes = [] } = useListClientes();
  const { data: produtos = [] } = useListProdutos();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    clienteId: "",
    dataOrcamento: today,
    validade: "",
    desconto: "0",
    observacoes: "",
  });
  const [itens, setItens] = useState<ItemRow[]>([emptyItem()]);

  const createMut = useMutation({
    mutationFn: (data: any) => createOrcamento(data),
    onSuccess: (data) => {
      toast({ title: "Orçamento criado!" });
      qc.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
      setLocation(`/orcamentos/${data.id}`);
    },
    onError: () => toast({ title: "Erro ao criar orçamento", variant: "destructive" }),
  });

  const addItem = () => setItens(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, key: keyof ItemRow, val: string | number | null) => {
    setItens(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [key]: val };
      if (key === "produtoId" && val) {
        const p = produtos.find(p => p.id === val);
        if (p) updated.valorUnitario = String(p.valor);
      }
      return updated;
    }));
  };

  const subtotal = itens.reduce((sum, i) => sum + (parseFloat(i.quantidade) || 0) * (parseFloat(i.valorUnitario) || 0), 0);
  const total = subtotal - (parseFloat(form.desconto) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId) { toast({ title: "Selecione um cliente", variant: "destructive" }); return; }
    if (itens.length === 0) { toast({ title: "Adicione ao menos um item", variant: "destructive" }); return; }

    createMut.mutate({
      clienteId: parseInt(form.clienteId),
      dataOrcamento: form.dataOrcamento,
      validade: form.validade || undefined,
      desconto: parseFloat(form.desconto) || 0,
      observacoes: form.observacoes || undefined,
      itens: itens.map(i => ({
        produtoId: i.produtoId ?? undefined,
        descricaoManual: i.descricaoManual || undefined,
        quantidade: parseFloat(i.quantidade) || 1,
        valorUnitario: parseFloat(i.valorUnitario) || 0,
      })),
    });
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/orcamentos"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-xl font-bold">Novo Orçamento</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Dados do Orçamento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Cliente *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.clienteId} onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}>
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
                </select>
              </div>
              <div>
                <Label>Data do Orçamento *</Label>
                <Input type="date" value={form.dataOrcamento} onChange={e => setForm(p => ({ ...p, dataOrcamento: e.target.value }))} />
              </div>
              <div>
                <Label>Validade</Label>
                <Input type="date" value={form.validade} onChange={e => setForm(p => ({ ...p, validade: e.target.value }))} />
              </div>
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.desconto} onChange={e => setForm(p => ({ ...p, desconto: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Itens</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Item</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {itens.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <Label className="text-xs">Produto</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={item.produtoId ?? ""}
                      onChange={e => updateItem(i, "produtoId", e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Descrição manual</option>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <Label className="text-xs">Descrição Manual</Label>
                    <Input
                      value={item.descricaoManual}
                      onChange={e => updateItem(i, "descricaoManual", e.target.value)}
                      placeholder="Descrição"
                      disabled={!!item.produtoId}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" step="0.01" min="0" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} />
                  </div>
                  <div className="col-span-5 md:col-span-2">
                    <Label className="text-xs">Valor Unit. (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={item.valorUnitario} onChange={e => updateItem(i, "valorUnitario", e.target.value)} />
                  </div>
                  <div className="col-span-3 md:col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="col-span-12 text-right text-sm font-medium text-muted-foreground">
                    Subtotal: {formatCurrency((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0))}
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                <p className="text-sm text-muted-foreground">Desconto: −{formatCurrency(parseFloat(form.desconto) || 0)}</p>
                <p className="text-lg font-bold">Total: {formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild><Link href="/orcamentos">Cancelar</Link></Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Criando..." : "Criar Orçamento"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
