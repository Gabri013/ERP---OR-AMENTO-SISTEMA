import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListUsuarios } from "@workspace/api-client-react";
import { createUsuario, updateUsuario, deleteUsuario, getListUsuariosQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import type { Usuario } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

const TIPOS = [
  { value: "master", label: "Master" },
  { value: "vendedor", label: "Vendedor" },
  { value: "projetista", label: "Projetista" },
  { value: "gerente", label: "Gerente" },
  { value: "producao", label: "Produção" },
  { value: "corte", label: "Corte" },
  { value: "dobra", label: "Dobra" },
  { value: "solda", label: "Solda" },
  { value: "acabamento", label: "Acabamento" },
  { value: "finalizacao", label: "Finalização" },
  { value: "montagem", label: "Montagem" },
  { value: "dashboard_producao", label: "Dashboard Produção" },
];

interface UserForm {
  nome: string;
  email: string;
  senha: string;
  tipo: string;
  status: string;
  telefoneWhatsapp: string;
}

const empty: UserForm = { nome: "", email: "", senha: "", tipo: "vendedor", status: "ativo", telefoneWhatsapp: "" };

export default function UsuariosPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UserForm>(empty);

  const { data: usuarios = [], isLoading } = useListUsuarios();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListUsuariosQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: any) => createUsuario(data),
    onSuccess: () => { toast({ title: "Usuário criado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao criar usuário", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: any }) => updateUsuario(data.id, data.body),
    onSuccess: () => { toast({ title: "Usuário atualizado!" }); invalidate(); setOpen(false); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => { toast({ title: "Usuário removido!" }); invalidate(); },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, senha: "", tipo: u.tipo, status: u.status, telefoneWhatsapp: u.telefoneWhatsapp ?? "" });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) { toast({ title: "Nome e e-mail são obrigatórios", variant: "destructive" }); return; }
    if (!editing && !form.senha) { toast({ title: "Senha é obrigatória", variant: "destructive" }); return; }
    const payload: any = { nome: form.nome, email: form.email, tipo: form.tipo, status: form.status, telefoneWhatsapp: form.telefoneWhatsapp || undefined };
    if (form.senha) payload.senha = form.senha;
    if (editing) updateMut.mutate({ id: editing.id, body: payload });
    else createMut.mutate({ ...payload, senha: form.senha });
  };

  const tipoLabel = (tipo: string) => TIPOS.find(t => t.value === tipo)?.label ?? tipo;

  const f = (key: keyof UserForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Layout>
      <div className="space-y-6 p-4 lg:p-6 overflow-x-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Usuários</h1>
          </div>
          {currentUser?.tipo === "master" && (
            <Button onClick={openNew} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
          )}
        </div>

        <Card className="rounded-[12px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    {currentUser?.tipo === "master" && <TableHead className="w-24">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : usuarios.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{tipoLabel(u.tipo)}</Badge></TableCell>
                      <TableCell><Badge variant={u.status === "ativo" ? "default" : "secondary"}>{u.status}</Badge></TableCell>
                      {currentUser?.tipo === "master" && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                            {u.id !== currentUser?.id && (
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(u.id)}><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input {...f("nome")} />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input {...f("email")} type="email" />
              </div>
              <div>
                <Label>{editing ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</Label>
                <Input {...f("senha")} type="password" placeholder="••••••••" />
              </div>
              <div>
                <Label>Perfil</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input {...f("telefoneWhatsapp")} placeholder="(00) 00000-0000" />
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
