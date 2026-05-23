import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListProdutos } from "@workspace/api-client-react";
import { createProduto, updateProduto, deleteProduto, getListProdutosQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import type { Produto } from "@workspace/api-client-react";

interface ProdutoForm {
  codigo: string;
  nome: string;
  descricao: string;
  valor: string;
  estoque: string;
  status: string;
}

const empty: ProdutoForm = { codigo: "", nome: "", descricao: "", valor: "0", estoque: "0", status: "ativo" };

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function ProdutosPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState<ProdutoForm>(empty);

  const { data: produtos = [], isLoading } = useListProdutos({ q: search || undefined });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: any) => createProduto(data),
    onSuccess: () => { toast({ title: "Produto criado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao criar produto", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: any }) => updateProduto(data.id, data.body),
    onSuccess: () => { toast({ title: "Produto atualizado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProduto(id),
    onSuccess: () => { toast({ title: "Produto removido!" }); invalidate(); },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Produto) => {
    setEditing(p);
    setForm({
      codigo: p.codigo ?? "", nome: p.nome, descricao: p.descricao ?? "",
      valor: String(p.valor), estoque: String(p.estoque ?? 0), status: p.status ?? "ativo",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const payload = {
      ...form,
      valor: parseFloat(form.valor) || 0,
      estoque: parseInt(form.estoque) || 0,
    };
    if (editing) updateMut.mutate({ id: editing.id, body: payload });
    else createMut.mutate(payload);
  };

  const f = (key: keyof ProdutoForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Produtos</h1>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : produtos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
                ) : produtos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-sm font-mono">{p.codigo ?? "—"}</TableCell>
                    <TableCell>
                      <p className="font-medium">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.descricao}</p>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium">{formatCurrency(p.valor)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{p.estoque}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "ativo" ? "default" : "secondary"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código</Label>
                  <Input {...f("codigo")} placeholder="SKU-001" />
                </div>
                <div>
                  <Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input {...f("nome")} />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea {...f("descricao")} rows={2} />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input {...f("valor")} type="number" step="0.01" min="0" />
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input {...f("estoque")} type="number" min="0" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
