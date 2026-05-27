import { TipoUsuario } from '@prisma/client';

export type PermissionAction = 
  | 'criar' 
  | 'editar' 
  | 'deletar' 
  | 'visualizar' 
  | 'avancar_etapa'
  | 'converter'
  | 'gerar_os'
  | 'fazer_pagamento'
  | 'relatorios';

export type PermissionLevel = 
  | 'all'           // Vê/faz tudo
  | 'own'           // Só o seu próprio
  | 'own_setor'     // Só do seu setor
  | 'own_etapa'     // Só da sua etapa de produção
  | 'own_created'   // Só o que criou
  | 'linked'        // Só relacionado
  | 'none';         // Não tem acesso

export interface PermissionConfig {
  [module: string]: {
    [action: string]: boolean | PermissionLevel;
  };
}

/**
 * Definição de permissões por tipo de usuário (role)
 * Cada role tem permissões específicas para cada módulo
 */
export const rolePermissions: Record<TipoUsuario, PermissionConfig> = {
  master: {
    clientes: {
      criar: true,
      editar: true,
      deletar: true,
      visualizar: 'all',
    },
    orcamentos: {
      criar: true,
      editar: true,
      deletar: true,
      visualizar: 'all',
      converter: true,
      relatorios: true,
    },
    vendas: {
      criar: true,
      editar: true,
      deletar: true,
      visualizar: 'all',
      gerar_os: true,
      relatorios: true,
    },
    os: {
      criar: true,
      editar: true,
      deletar: true,
      visualizar: 'all',
      avancar_etapa: true,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'all',
      fazer_pagamento: true,
      relatorios: true,
    },
    usuarios: {
      criar: true,
      editar: true,
      deletar: true,
    },
    dashboards: {
      executivo: true,
      vendas: true,
      producao: true,
      financeiro: true,
    },
  },

  gerente: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: 'linked',
      relatorios: true,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: true,
      relatorios: true,
    },
    os: {
      criar: false,
      editar: 'own_setor',
      deletar: false,
      visualizar: 'own_setor',
      avancar_etapa: true,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'own_setor',
      fazer_pagamento: false,
      relatorios: true,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_setor',
      vendas: false,
      financeiro: false,
    },
  },

  gestor_vendas: {
    clientes: {
      criar: true,
      editar: true,
      deletar: false,
      visualizar: 'all',
    },
    orcamentos: {
      criar: true,
      editar: 'own_created',
      deletar: 'own_created',
      visualizar: 'all',
      converter: true,
      relatorios: true,
    },
    vendas: {
      criar: true,
      editar: 'own_created',
      deletar: false,
      visualizar: 'all',
      gerar_os: true,
      relatorios: true,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      avancar_etapa: false,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'own_created',
      fazer_pagamento: false,
      relatorios: true,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      vendas: true,
      producao: false,
      financeiro: false,
    },
  },

  vendedor: {
    clientes: {
      criar: true,
      editar: false,
      deletar: false,
      visualizar: 'all',
    },
    orcamentos: {
      criar: true,
      editar: 'own_created',
      deletar: false,
      visualizar: 'own_created',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      avancar_etapa: false,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      vendas: true,
      producao: false,
      financeiro: false,
    },
  },

  financeiro: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      converter: false,
      relatorios: true,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      gerar_os: false,
      relatorios: true,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      avancar_etapa: false,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'all',
      fazer_pagamento: true,
      relatorios: true,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      financeiro: true,
      vendas: false,
      producao: false,
    },
  },

  engenharia: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  producao: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'own_setor',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_setor',
      vendas: false,
      financeiro: false,
    },
  },

  consultor: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      converter: false,
      relatorios: true,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      gerar_os: false,
      relatorios: true,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      avancar_etapa: false,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'all',
      fazer_pagamento: false,
      relatorios: true,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      executivo: true,
      vendas: true,
      producao: true,
      financeiro: true,
    },
  },

  // Para outros setores (corte, dobra, solda, etc)
  corte: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  dobra: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  solda: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  montagem: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  visualizador: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      converter: false,
      relatorios: true,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      gerar_os: false,
      relatorios: true,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      avancar_etapa: false,
      relatorios: true,
    },
    financeiro: {
      visualizar: 'all',
      fazer_pagamento: false,
      relatorios: true,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      executivo: true,
      vendas: true,
      producao: true,
      financeiro: true,
    },
  },

  projetista: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
    },
    dashboards: {
      producao: 'own_etapa',
      vendas: false,
      financeiro: false,
    },
  },

  dashboard_producao: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'all',
      avancar_etapa: false,
      relatorios: true,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: false,
    },
    dashboards: {
      executivo: false,
      vendas: false,
      producao: true,
      financeiro: false,
    },
  },

  refrigeracao: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: false,
    },
    dashboards: {
      executivo: false,
      vendas: false,
      producao: true,
      financeiro: false,
    },
  },

  acabamento: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: false,
    },
    dashboards: {
      executivo: false,
      vendas: false,
      producao: true,
      financeiro: false,
    },
  },

  finalizacao: {
    clientes: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
    },
    orcamentos: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      converter: false,
      relatorios: false,
    },
    vendas: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: 'linked',
      gerar_os: false,
      relatorios: false,
    },
    os: {
      criar: false,
      editar: 'own_etapa',
      deletar: false,
      visualizar: 'own_etapa',
      avancar_etapa: true,
      relatorios: false,
    },
    financeiro: {
      visualizar: false,
      fazer_pagamento: false,
      relatorios: false,
    },
    usuarios: {
      criar: false,
      editar: false,
      deletar: false,
      visualizar: false,
    },
    dashboards: {
      executivo: false,
      vendas: false,
      producao: true,
      financeiro: false,
    },
  },
};

/**
 * Verifica se usuário tem permissão para uma ação
 * @returns true se tem permissão, false caso contrário
 */
export const hasPermission = (
  userRole: TipoUsuario,
  module: string,
  action: string
): boolean => {
  const permissions = rolePermissions[userRole];
  if (!permissions) return false;

  const modulePerms = permissions[module];
  if (!modulePerms) return false;

  const permission = modulePerms[action];
  if (permission === undefined) return false;

  // Se é boolean, retorna direto
  if (typeof permission === 'boolean') return permission;

  // Se é PermissionLevel, só retorna true se não for 'none'
  return permission !== 'none';
};

/**
 * Obtém o nível de permissão
 * @returns PermissionLevel ou boolean
 */
export const getPermissionLevel = (
  userRole: TipoUsuario,
  module: string,
  action: string
): PermissionLevel | boolean => {
  const permissions = rolePermissions[userRole];
  if (!permissions) return false;

  const modulePerms = permissions[module];
  if (!modulePerms) return false;

  return modulePerms[action] ?? false;
};

/**
 * Verifica múltiplas permissões (AND logic)
 */
export const hasAllPermissions = (
  userRole: TipoUsuario,
  permissions: [string, string][]
): boolean => {
  return permissions.every(([module, action]) =>
    hasPermission(userRole, module, action)
  );
};

/**
 * Verifica múltiplas permissões (OR logic)
 */
export const hasAnyPermission = (
  userRole: TipoUsuario,
  permissions: [string, string][]
): boolean => {
  return permissions.some(([module, action]) =>
    hasPermission(userRole, module, action)
  );
};

export default {
  rolePermissions,
  hasPermission,
  getPermissionLevel,
  hasAllPermissions,
  hasAnyPermission,
};
