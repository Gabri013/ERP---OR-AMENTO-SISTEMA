import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListClientes } from "@workspace/api-client-react";
import { createCliente, updateCliente, deleteCliente } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getListClientesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import type { Cliente } from "@workspace/api-client-react";

interface ClienteForm {
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  observacoes: string;
}

const empty: ClienteForm = {
  razaoSocial: "", nomeFantasia: "", cnpjCpf: "", endereco: "",
  cidade: "", estado: "", cep: "", telefone: "", email: "", observacoes: "",
};

export default function ClientesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteForm>(empty);

  const { data: clientes = [], isLoading } = useListClientes({ q: search || undefined });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListClientesQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: ClienteForm) => createCliente(data),
    onSuccess: () => { toast({ title: "Cliente criado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao criar cliente", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: Partial<ClienteForm> }) => updateCliente(data.id, data.body),
    onSuccess: () => { toast({ title: "Cliente atualizado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCliente(id),
    onSuccess: () => { toast({ title: "Cliente removido!" }); invalidate(); },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      razaoSocial: c.razaoSocial ?? "", nomeFantasia: c.nomeFantasia ?? "",
      cnpjCpf: c.cnpjCpf ?? "", endereco: c.endereco ?? "",
      cidade: c.cidade ?? "", estado: c.estado ?? "", cep: c.cep ?? "",
      telefone: c.telefone ?? "", email: c.email ?? "", observacoes: c.observacoes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razaoSocial.trim()) { toast({ title: "Razão social é obrigatória", variant: "destructive" }); return; }
    if (editing) {
      updateMut.mutate({ id: editing.id, body: form });
    } else {
      createMut.mutate(form);
    }
  };

  const f = (key: keyof ClienteForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Clientes</h1>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="rounded-[12px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead className="hidden sm:table-cell">CNPJ/CPF</TableHead>
                    <TableHead className="hidden md:table-cell">Cidade</TableHead>
                    <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : clientes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
                  ) : clientes.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.razaoSocial}</p>
                        {c.nomeFantasia && <p className="text-xs text-muted-foreground">{c.nomeFantasia}</p>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{c.cnpjCpf ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.cidade ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{c.telefone ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Razão Social *</Label>
                  <Input {...f("razaoSocial")} placeholder="Nome ou Razão Social" />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input {...f("nomeFantasia")} placeholder="Nome Fantasia" />
                </div>
                <div>
                  <Label>CNPJ / CPF</Label>
                  <Input {...f("cnpjCpf")} placeholder="00.000.000/0000-00" />
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input {...f("endereco")} placeholder="Rua, número, bairro" />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input {...f("cidade")} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input {...f("estado")} maxLength={2} placeholder="SP" />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input {...f("cep")} placeholder="00000-000" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input {...f("telefone")} placeholder="(00) 00000-0000" />
                </div>
                <div className="md:col-span-2">
                  <Label>E-mail</Label>
                  <Input {...f("email")} type="email" />
                </div>
                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea {...f("observacoes")} rows={3} />
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
