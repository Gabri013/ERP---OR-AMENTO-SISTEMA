import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Building2, Save, X, Users } from "lucide-react";
import { RESOURCE_PERMISSIONS, PERMISSION_DESCRIPTIONS, type Permission, type Resource, type PermissionAction, SETOR_VALUES } from "@/types/permissions";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useListPermissoesSetor, updatePermissoesSetor } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const setorInfo: Record<string, { nome: string; descricao: string; usuarios: number }> = {
  administrativo: { nome: "Administrativo", descricao: "Geral financeiro, RH e TI", usuarios: 8 },
  comercial: { nome: "Comercial", descricao: "Vendas, orçamentos e atendimento", usuarios: 12 },
  financeiro: { nome: "Financeiro", descricao: "Contas a pagar/receber e tesouraria", usuarios: 6 },
  producao: { nome: "Produção", descricao: "PCP, corte, dobra, solda e montagem", usuarios: 25 },
  engenharia: { nome: "Engenharia", descricao: "Projetos e desenvolvimento", usuarios: 8 },
  pcp: { nome: "PCP", descricao: "Planejamento e controle de produção", usuarios: 5 },
  qualidade: { nome: "Qualidade", descricao: "Controle de qualidade e inspeções", usuarios: 4 },
  rh: { nome: "RH", descricao: "Recursos humanos", usuarios: 3 },
  compras: { nome: "Compras", descricao: "Compras e fornecedores", usuarios: 4 },
  logistica: { nome: "Logística", descricao: "Estoque e distribuição", usuarios: 6 },
  assistencia_tecnica: { nome: "Assistência Técnica", descricao: "Suporte técnico e manutenção", usuarios: 5 },
  ti: { nome: "TI", descricao: "Tecnologia da informação", usuarios: 2 },
  estoque: { nome: "Estoque", descricao: "Gestão de estoque", usuarios: 4 },
};

export default function PermissoesSetorPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const setoresList = SETOR_VALUES;
  const { data: setorPermissions = [] } = useListPermissoesSetor(selectedSetor || "");

  const totalPages = Math.ceil(setoresList.length / itemsPerPage);
  const paginatedSetores = setoresList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateMut = useMutation({
    mutationFn: (data: { setor: string; permissoes: string[] }) =>
      updatePermissoesSetor(data.setor, data.permissoes),
    onSuccess: () => {
      toast({
        title: "Permissões atualizadas com sucesso!",
        description: `As permissões do setor ${setorInfo[selectedSetor || ""]?.nome} foram salvas.`,
      });
      qc.invalidateQueries({ queryKey: ["permissoes-setor", selectedSetor] });
      setOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar permissões", variant: "destructive" }),
  });

  const openPermissionsDialog = (setor: string) => {
    setSelectedSetor(setor);
    setSelectedPermissions(new Set(setorPermissions || []));
    setOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedSetor) return;
    updateMut.mutate({ setor: selectedSetor, permissoes: Array.from(selectedPermissions) });
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

  const getPermissionCount = (setor: string) => {
    if (selectedSetor === setor) {
      return setorPermissions.length || 0;
    }
    return 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Gestão de Permissões por Setor</h1>
          </div>
        </div>

        <Card className="rounded-[12px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Usuários</TableHead>
                    <TableHead className="hidden lg:table-cell">Permissões</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSetores.map((setor) => (
                    <TableRow key={setor}>
                      <TableCell>
                        <p className="font-medium">{setorInfo[setor]?.nome}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{setorInfo[setor]?.descricao}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{setorInfo[setor]?.usuarios}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getPermissionCount(setor)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPermissionsDialog(setor)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={setoresList.length}
            itemsPerPage={itemsPerPage}
          />
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003D7A] text-white text-sm font-bold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{setorInfo[selectedSetor || ""]?.nome}</p>
                    <p className="text-sm text-muted-foreground">{setorInfo[selectedSetor || ""]?.descricao}</p>
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
              <Button onClick={handleSavePermissions} disabled={updateMut.isPending}>
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
