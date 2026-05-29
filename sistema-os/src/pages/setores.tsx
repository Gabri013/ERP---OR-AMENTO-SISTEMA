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
import { SETOR_VALUES, type SetorInfo, type Setor } from "@/types/permissions";
import { Skeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dados mockados de setores (em produção, viriam da API)
const mockSetores: SetorInfo[] = [
  {
    id: "1",
    nome: "Administrativo",
    descricao: "Geral financeiro, RH e TI",
    responsavelId: "1",
    usuarios: ["1", "2", "3"],
    permissoes: ["financeiro_read", "rh_read", "configuracoes_read"],
    ativo: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    nome: "Comercial",
    descricao: "Vendas, orçamentos e atendimento",
    responsavelId: "4",
    usuarios: ["4", "5", "6"],
    permissoes: ["vendas_create", "vendas_read", "orcamentos_create", "orcamentos_read"],
    ativo: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    nome: "Produção",
    descricao: "PCP, corte, dobra, solda e montagem",
    responsavelId: "7",
    usuarios: ["7", "8", "9"],
    permissoes: ["os_read", "os_update", "producao_read", "producao_update"],
    ativo: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    nome: "Engenharia",
    descricao: "Projetos e desenvolvimento",
    responsavelId: "10",
    usuarios: ["10", "11"],
    permissoes: ["engenharia_create", "engenharia_read", "engenharia_update"],
    ativo: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    nome: "Qualidade",
    descricao: "Controle de qualidade e inspeções",
    responsavelId: "12",
    usuarios: ["12"],
    permissoes: ["qualidade_read", "qualidade_create"],
    ativo: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

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
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SetorInfo | null>(null);
  const [form, setForm] = useState<SetorForm>(empty);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredSetores = mockSetores.filter(
    (s) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSetores.length / itemsPerPage);
  const paginatedSetores = filteredSetores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (setor: SetorInfo) => {
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
    if (editing) {
      toast({ title: "Setor atualizado com sucesso!", description: "As alterações foram salvas." });
    } else {
      toast({ title: "Setor criado com sucesso!", description: "O setor foi adicionado ao sistema." });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    toast({ title: "Setor removido com sucesso!", description: "O setor foi excluído do sistema." });
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
                            <span className="text-sm">{setor.usuarios.length}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{setor.permissoes.length}</span>
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
                <Button type="submit">{editing ? "Atualizar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
