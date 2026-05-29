import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Building2, Users, ShieldCheck } from "lucide-react";
import { useListSetores, createSetor, updateSetor, deleteSetor, getListSetoresQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SetorForm {
  nome: string;
  descricao: string;
  responsavelId: string | number;
}

const empty: SetorForm = {
  nome: "",
  descricao: "",
  responsavelId: "",
};

export default function SetoresPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<SetorForm>(empty);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: setores = [], isLoading } = useListSetores();

  const filteredSetores = setores.filter(
    (s: any) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSetores.length / itemsPerPage);
  const paginatedSetores = filteredSetores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const createMut = useMutation({
    mutationFn: (data: any) => createSetor(data),
    onSuccess: () => {
      toast({ title: "Setor criado com sucesso!", description: "O setor foi adicionado ao sistema." });
      qc.invalidateQueries({ queryKey: getListSetoresQueryKey() });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar setor", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: number; body: any }) => updateSetor(data.id, data.body),
    onSuccess: () => {
      toast({ title: "Setor atualizado com sucesso!", description: "As alterações foram salvas." });
      qc.invalidateQueries({ queryKey: getListSetoresQueryKey() });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar setor", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSetor(id),
    onSuccess: () => {
      toast({ title: "Setor removido com sucesso!", description: "O setor foi excluído do sistema." });
      qc.invalidateQueries({ queryKey: getListSetoresQueryKey() });
    },
    onError: () => toast({ title: "Erro ao remover setor", variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (setor: any) => {
    setEditing(setor);
    setForm({
      nome: setor.nome,
      descricao: setor.descricao,
      responsavelId: setor.responsavelId,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ title: "Nome do setor é obrigatório", variant: "destructive" });
      return;
    }
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      responsavelId: form.responsavelId ? parseInt(String(form.responsavelId)) : undefined,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, body: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate(id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const f = (key: keyof SetorForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Gestão de Setores</h1>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" /> Novo Setor
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar setores..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <Card className="rounded-[12px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Usuários</TableHead>
                    <TableHead className="hidden lg:table-cell">Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSetores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum setor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSetores.map((setor) => (
                      <TableRow key={setor.id}>
                        <TableCell>
                          <p className="font-medium">{setor.nome}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{setor.descricao}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{setor.usuarios?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{setor.permissoes?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={setor.ativo ? "default" : "secondary"}>
                            {setor.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(setor)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar setor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(setor.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir setor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSetores.length}
            itemsPerPage={itemsPerPage}
          />
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Setor" : "Novo Setor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Setor *</Label>
                <Input id="nome" {...f("nome")} placeholder="Ex: Comercial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" {...f("descricao")} placeholder="Descrição do setor..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input id="responsavel" {...f("responsavelId")} placeholder="ID do responsável" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Atualizar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
