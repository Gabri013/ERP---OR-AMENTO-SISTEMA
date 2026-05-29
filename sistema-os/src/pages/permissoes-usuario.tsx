import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ShieldCheck, User, Save, X } from "lucide-react";
import { RESOURCE_PERMISSIONS, PERMISSION_DESCRIPTIONS, type Permission, type Resource, type PermissionAction } from "@/types/permissions";
import { Skeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dados mockados de usuários (em produção, viriam da API)
const mockUsuarios = [
  { id: "1", nome: "João Silva", email: "joao@empresa.com", tipo: "master" },
  { id: "2", nome: "Maria Santos", email: "maria@empresa.com", tipo: "gerente" },
  { id: "3", nome: "Pedro Costa", email: "pedro@empresa.com", tipo: "vendedor" },
  { id: "4", nome: "Ana Oliveira", email: "ana@empresa.com", tipo: "producao" },
  { id: "5", nome: "Carlos Ferreira", email: "carlos@empresa.com", tipo: "financeiro" },
  { id: "6", nome: "Lucia Mendes", email: "lucia@empresa.com", tipo: "engenharia" },
];

// Permissões mockadas por usuário
const mockUserPermissions: Record<string, string[]> = {
  "1": Object.entries(RESOURCE_PERMISSIONS).flatMap(([resource, actions]) =>
    actions.map((action) => `${resource}_${action}`)
  ),
  "2": Object.entries(RESOURCE_PERMISSIONS)
    .filter(([_, actions]) => !actions.includes("admin"))
    .flatMap(([resource, actions]) => actions.map((action) => `${resource}_${action}`)),
  "3": ["orcamentos_create", "orcamentos_read", "orcamentos_update", "vendas_create", "vendas_read", "clientes_read"],
  "4": ["os_read", "os_update", "producao_read", "producao_update", "estoque_read"],
  "5": ["financeiro_read", "financeiro_export", "contas_receber_read", "contas_pagar_read"],
  "6": ["engenharia_read", "engenharia_create", "engenharia_update", "os_read"],
};

export default function PermissoesUsuarioPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsuarios[0] | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsuarios = mockUsuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openPermissionsDialog = (usuario: typeof mockUsuarios[0]) => {
    setSelectedUser(usuario);
    setSelectedPermissions(new Set(mockUserPermissions[usuario.id] || []));
    setOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    // Em produção, chamaria a API para salvar as permissões
    mockUserPermissions[selectedUser.id] = Array.from(selectedPermissions);
    
    toast({
      title: "Permissões atualizadas com sucesso!",
      description: `As permissões do usuário ${selectedUser.nome} foram salvas.`,
    });
    setOpen(false);
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleToggleResource = (resource: Resource, actions: PermissionAction[]) => {
    const permissionIds = actions.map((action) => `${resource}_${action}`);
    const allSelected = permissionIds.every((id) => selectedPermissions.has(id));
    
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        permissionIds.forEach((id) => newSet.delete(id));
      } else {
        permissionIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const getPermissionCount = (userId: string) => {
    return mockUserPermissions[userId]?.length || 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Gestão de Permissões por Usuário</h1>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar usuários..."
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
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Permissões</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#003D7A] text-white text-xs font-bold">
                              {usuario.nome.charAt(0)}
                            </div>
                            <p className="font-medium">{usuario.nome}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{usuario.tipo}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{getPermissionCount(usuario.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPermissionsDialog(usuario)}
                                >
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Permissões
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Gerenciar permissões</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
            totalItems={filteredUsuarios.length}
            itemsPerPage={itemsPerPage}
          />
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003D7A] text-white text-sm font-bold">
                    {selectedUser?.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{selectedUser?.nome}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Permissões Selecionadas</p>
                  <p className="text-xs text-muted-foreground">{selectedPermissions.size} de {Object.entries(RESOURCE_PERMISSIONS).flatMap(([_, actions]) => actions).length}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPermissions(new Set())}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              <div className="space-y-3">
                {Object.entries(RESOURCE_PERMISSIONS).map(([resource, actions]) => {
                  const permissionIds = actions.map((action) => `${resource}_${action}`);
                  const allSelected = permissionIds.every((id) => selectedPermissions.has(id));
                  const someSelected = permissionIds.some((id) => selectedPermissions.has(id));

                  return (
                    <Card key={resource} className="rounded-[8px]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`resource-${resource}`}
                              checked={allSelected}
                              onCheckedChange={() => handleToggleResource(resource as Resource, actions)}
                            />
                            <Label
                              htmlFor={`resource-${resource}`}
                              className="font-medium cursor-pointer"
                            >
                              {resource.charAt(0).toUpperCase() + resource.slice(1)}
                            </Label>
                          </div>
                          <Badge variant={someSelected ? "default" : "secondary"} className="text-xs">
                            {permissionIds.filter((id) => selectedPermissions.has(id)).length}/{permissionIds.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {actions.map((action) => {
                            const permissionId = `${resource}_${action}`;
                            return (
                              <div key={permissionId} className="flex items-center gap-2">
                                <Checkbox
                                  id={permissionId}
                                  checked={selectedPermissions.has(permissionId)}
                                  onCheckedChange={() => handleTogglePermission(permissionId)}
                                />
                                <Label htmlFor={permissionId} className="text-sm cursor-pointer">
                                  {PERMISSION_DESCRIPTIONS[action]}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePermissions}>
                <Save className="h-4 w-4 mr-1" />
                Salvar Permissões
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
