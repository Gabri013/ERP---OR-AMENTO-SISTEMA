// Sistema completo de permissões e setores

// Tipos de permissões granulares
export type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "import" | "approve" | "admin";

// Recursos do sistema
export type Resource =
  | "dashboard"
  | "orcamentos"
  | "vendas"
  | "os"
  | "financeiro"
  | "contas_receber"
  | "contas_pagar"
  | "clientes"
  | "produtos"
  | "usuarios"
  | "setores"
  | "permissoes"
  | "engenharia"
  | "producao"
  | "pcp"
  | "estoque"
  | "compras"
  | "rh"
  | "qualidade"
  | "assistencia_tecnica"
  | "etiquetas"
  | "configuracoes"
  | "relatorios";

// Setores/Departamentos
export const SETOR_VALUES = [
  "administrativo",
  "comercial",
  "financeiro",
  "producao",
  "engenharia",
  "pcp",
  "qualidade",
  "rh",
  "compras",
  "logistica",
  "assistencia_tecnica",
  "ti",
  "estoque",
] as const;

export type Setor = typeof SETOR_VALUES[number];

// Permissão completa
export interface Permission {
  id: string;
  resource: Resource;
  action: PermissionAction;
  description: string;
}

// Permissão de usuário
export interface UserPermission {
  id: string;
  userId: string | number;
  permissionId: string;
  grantedBy: string | number;
  grantedAt: string;
}

// Permissão de setor
export interface SetorPermission {
  id: string;
  setor: Setor;
  permissionId: string;
  grantedBy: string | number;
  grantedAt: string;
}

// Setor com detalhes
export interface SetorInfo {
  id: string;
  nome: string;
  descricao: string;
  responsavelId: string | number;
  usuarios: string[];
  permissoes: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template de permissões por role
export interface RolePermissionTemplate {
  role: string;
  permissions: Permission[];
  setores: Setor[];
}

// Permissões pré-definidas por recurso
export const RESOURCE_PERMISSIONS: Record<Resource, PermissionAction[]> = {
  dashboard: ["read"],
  orcamentos: ["create", "read", "update", "delete", "export", "approve"],
  vendas: ["create", "read", "update", "delete", "export", "approve"],
  os: ["create", "read", "update", "delete", "export", "approve"],
  financeiro: ["read", "export", "approve"],
  contas_receber: ["create", "read", "update", "delete", "export", "approve"],
  contas_pagar: ["create", "read", "update", "delete", "export", "approve"],
  clientes: ["create", "read", "update", "delete", "export"],
  produtos: ["create", "read", "update", "delete", "export"],
  usuarios: ["create", "read", "update", "delete", "admin"],
  setores: ["create", "read", "update", "delete", "admin"],
  permissoes: ["read", "admin"],
  engenharia: ["read", "create", "update", "delete", "export"],
  producao: ["read", "create", "update", "delete", "export"],
  pcp: ["read", "create", "update", "delete", "export"],
  estoque: ["read", "create", "update", "delete", "export"],
  compras: ["read", "create", "update", "delete", "export", "approve"],
  rh: ["read", "create", "update", "delete", "export"],
  qualidade: ["read", "create", "update", "delete", "export"],
  assistencia_tecnica: ["read", "create", "update", "delete", "export"],
  etiquetas: ["read", "create", "export"],
  configuracoes: ["read", "update", "admin"],
  relatorios: ["read", "export"],
};

// Descrições das permissões
export const PERMISSION_DESCRIPTIONS: Record<PermissionAction, string> = {
  create: "Criar novos registros",
  read: "Visualizar informações",
  update: "Editar registros existentes",
  delete: "Excluir registros",
  export: "Exportar dados",
  import: "Importar dados",
  approve: "Aprovar registros",
  admin: "Administrativo completo",
};

// Templates de permissões por role
export const ROLE_TEMPLATES: RolePermissionTemplate[] = [
  {
    role: "master",
    permissions: Object.entries(RESOURCE_PERMISSIONS).flatMap(([resource, actions]) =>
      actions.map((action) => ({
        id: `${resource}_${action}`,
        resource: resource as Resource,
        action,
        description: `${PERMISSION_DESCRIPTIONS[action]} em ${resource}`,
      }))
    ),
    setores: [...SETOR_VALUES] as Setor[],
  },
  {
    role: "gerente",
    permissions: Object.entries(RESOURCE_PERMISSIONS).flatMap(([resource, actions]) =>
      actions
        .filter((a) => a !== "admin")
        .map((action) => ({
          id: `${resource}_${action}`,
          resource: resource as Resource,
          action,
          description: `${PERMISSION_DESCRIPTIONS[action]} em ${resource}`,
        }))
    ),
    setores: ["administrativo", "comercial", "financeiro", "producao", "engenharia"],
  },
  {
    role: "vendedor",
    permissions: [
      { id: "orcamentos_create", resource: "orcamentos", action: "create", description: "Criar orçamentos" },
      { id: "orcamentos_read", resource: "orcamentos", action: "read", description: "Visualizar orçamentos" },
      { id: "orcamentos_update", resource: "orcamentos", action: "update", description: "Editar orçamentos" },
      { id: "vendas_create", resource: "vendas", action: "create", description: "Criar vendas" },
      { id: "vendas_read", resource: "vendas", action: "read", description: "Visualizar vendas" },
      { id: "vendas_update", resource: "vendas", action: "update", description: "Editar vendas" },
      { id: "clientes_read", resource: "clientes", action: "read", description: "Visualizar clientes" },
      { id: "produtos_read", resource: "produtos", action: "read", description: "Visualizar produtos" },
    ],
    setores: ["comercial"],
  },
  {
    role: "producao",
    permissions: [
      { id: "os_read", resource: "os", action: "read", description: "Visualizar ordens de serviço" },
      { id: "os_update", resource: "os", action: "update", description: "Atualizar ordens de serviço" },
      { id: "producao_read", resource: "producao", action: "read", description: "Visualizar produção" },
      { id: "producao_update", resource: "producao", action: "update", description: "Atualizar produção" },
      { id: "estoque_read", resource: "estoque", action: "read", description: "Visualizar estoque" },
      { id: "estoque_update", resource: "estoque", action: "update", description: "Atualizar estoque" },
    ],
    setores: ["producao", "pcp", "estoque"],
  },
  {
    role: "financeiro",
    permissions: [
      { id: "financeiro_read", resource: "financeiro", action: "read", description: "Visualizar financeiro" },
      { id: "financeiro_export", resource: "financeiro", action: "export", description: "Exportar financeiro" },
      { id: "contas_receber_read", resource: "contas_receber", action: "read", description: "Visualizar contas a receber" },
      { id: "contas_receber_create", resource: "contas_receber", action: "create", description: "Criar contas a receber" },
      { id: "contas_receber_update", resource: "contas_receber", action: "update", description: "Atualizar contas a receber" },
      { id: "contas_pagar_read", resource: "contas_pagar", action: "read", description: "Visualizar contas a pagar" },
      { id: "contas_pagar_create", resource: "contas_pagar", action: "create", description: "Criar contas a pagar" },
      { id: "contas_pagar_update", resource: "contas_pagar", action: "update", description: "Atualizar contas a pagar" },
    ],
    setores: ["financeiro"],
  },
  {
    role: "engenharia",
    permissions: [
      { id: "engenharia_read", resource: "engenharia", action: "read", description: "Visualizar engenharia" },
      { id: "engenharia_create", resource: "engenharia", action: "create", description: "Criar projetos" },
      { id: "engenharia_update", resource: "engenharia", action: "update", description: "Atualizar projetos" },
      { id: "os_read", resource: "os", action: "read", description: "Visualizar ordens de serviço" },
      { id: "os_update", resource: "os", action: "update", description: "Atualizar ordens de serviço" },
    ],
    setores: ["engenharia"],
  },
  {
    role: "visualizador",
    permissions: Object.entries(RESOURCE_PERMISSIONS).flatMap(([resource, actions]) =>
      actions
        .filter((a) => a === "read")
        .map((action) => ({
          id: `${resource}_${action}`,
          resource: resource as Resource,
          action,
          description: `${PERMISSION_DESCRIPTIONS[action]} em ${resource}`,
        }))
    ),
    setores: [],
  },
];
