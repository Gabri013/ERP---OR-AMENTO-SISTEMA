import { TipoUsuario } from '@prisma/client';
import { getPermissionLevel, PermissionLevel } from '../lib/permissions';

export interface FilterContext {
  userId: number;
  userRole: TipoUsuario;
  setorId?: number;
}

/**
 * Retorna filtro Prisma baseado em nível de permissão
 * Usado para filtrar dados no banco de dados automaticamente
 */
export const getDataFilter = (
  context: FilterContext,
  resource: 'orcamentos' | 'vendas' | 'os' | 'clientes' | 'financeiro'
) => {
  const { userId, userRole, setorId } = context;

  switch (resource) {
    case 'orcamentos':
      const orcPermLevel = getPermissionLevel(userRole, 'orcamentos', 'visualizar');

      if (orcPermLevel === 'all') {
        return {}; // Sem filtro - vê tudo
      }

      if (orcPermLevel === 'own_created') {
        return { usuarioId: userId }; // Só seus orçamentos
      }

      if (orcPermLevel === 'linked') {
        return { usuarioId: userId }; // Só relacionados
      }

      if (orcPermLevel === 'own_setor') {
        // Orçamentos do seu setor (se implementado)
        return { usuarioId: userId };
      }

      // Se 'none' ou false
      return { id: -1 }; // Retorna vazio (nenhum resultado)

    case 'vendas':
      const vendPermLevel = getPermissionLevel(userRole, 'vendas', 'visualizar');

      if (vendPermLevel === 'all') {
        return {};
      }

      if (vendPermLevel === 'own_created') {
        return { usuarioId: userId };
      }

      if (vendPermLevel === 'linked') {
        return { usuarioId: userId };
      }

      return { id: -1 };

    case 'os':
      const osPermLevel = getPermissionLevel(userRole, 'os', 'visualizar');

      if (osPermLevel === 'all') {
        return {};
      }

      if (osPermLevel === 'own_setor') {
        // Ordens que têm etapas do seu setor
        // Nota: Isso é simplificado, você pode refinar conforme necessário
        return {};
      }

      if (osPermLevel === 'own_etapa') {
        return {
          etapas: {
            some: { usuarioId: userId },
          },
        };
      }

      if (osPermLevel === 'linked') {
        return {
          venda: {
            usuarioId: userId,
          },
        };
      }

      return { id: -1 };

    case 'clientes':
      const clientPermLevel = getPermissionLevel(userRole, 'clientes', 'visualizar');

      if (clientPermLevel === 'all') {
        return {};
      }

      return { id: -1 };

    case 'financeiro':
      const finPermLevel = getPermissionLevel(userRole, 'financeiro', 'visualizar');

      if (finPermLevel === 'all') {
        return {};
      }

      if (finPermLevel === 'own_created') {
        return {
          venda: {
            usuarioId: userId,
          },
        };
      }

      return { id: -1 };

    default:
      return { id: -1 };
  }
};

/**
 * Verifica se usuário pode editar um recurso específico
 * Mais granular que o checkPermission middleware
 */
export const canEditResource = (
  context: FilterContext,
  resource: 'orcamento' | 'venda' | 'os' | 'cliente',
  resourceData: {
    usuarioId?: number;
    etapaAtual?: string;
    setorId?: number;
  }
): boolean => {
  const { userId, userRole, setorId } = context;

  const editPermLevel = getPermissionLevel(userRole, resource + 's', 'editar');

  // Se é true (acesso total), retorna true
  if (editPermLevel === true) return true;

  // Se é false ou 'none', retorna false
  if (editPermLevel === false || editPermLevel === 'none') return false;

  // Se é PermissionLevel, analisa conforme o nível
  if (editPermLevel === 'own_created') {
    return resourceData.usuarioId === userId;
  }

  if (editPermLevel === 'own_setor') {
    return resourceData.setorId === setorId;
  }

  if (editPermLevel === 'own_etapa') {
    return resourceData.etapaAtual === userRole;
  }

  if (editPermLevel === 'all') {
    return true;
  }

  if (editPermLevel === 'linked') {
    return resourceData.usuarioId === userId;
  }

  return false;
};

/**
 * Verifica se usuário pode fazer ação específica em um recurso
 */
export const canPerformAction = (
  context: FilterContext,
  action: 'criar' | 'editar' | 'deletar' | 'visualizar' | 'avancar_etapa',
  resource: 'orcamento' | 'venda' | 'os',
  resourceData?: {
    usuarioId?: number;
    etapaAtual?: string;
    setorId?: number;
  }
): boolean => {
  const permLevel = getPermissionLevel(context.userRole, resource + 's', action);

  if (permLevel === true) return true;
  if (permLevel === false || permLevel === 'none') return false;

  if (!resourceData) return false;

  if (permLevel === 'own_created') {
    return resourceData.usuarioId === context.userId;
  }

  if (permLevel === 'own_setor') {
    return resourceData.setorId === context.setorId;
  }

  if (permLevel === 'own_etapa') {
    return resourceData.etapaAtual === context.userRole;
  }

  if (permLevel === 'linked') {
    return resourceData.usuarioId === context.userId;
  }

  if (permLevel === 'all') {
    return true;
  }

  return false;
};

/**
 * Obtém permissões do usuário para um módulo
 * Útil para frontend decidir o que mostrar
 */
export const getModulePermissions = (userRole: TipoUsuario, module: string) => {
  const actions = ['criar', 'editar', 'deletar', 'visualizar'];
  const permissions: Record<string, boolean | PermissionLevel> = {};

  actions.forEach((action) => {
    const perm = getPermissionLevel(userRole, module, action);
    if (perm !== undefined) {
      permissions[action] = perm;
    }
  });

  return permissions;
};

/**
 * Filtra um array de dados baseado em permissões
 * Útil para filtrar no frontend ou quando dados já estão em memória
 */
export const filterDataByPermissions = (
  data: any[],
  context: FilterContext,
  resource: 'orcamento' | 'venda' | 'os',
  field: string = 'usuarioId'
): any[] => {
  const permLevel = getPermissionLevel(context.userRole, resource + 's', 'visualizar');

  if (permLevel === 'all') {
    return data;
  }

  if (permLevel === 'own_created' || permLevel === 'linked') {
    return data.filter((item) => item[field] === context.userId);
  }

  if (permLevel === 'own_setor') {
    return data.filter((item) => item.setorId === context.setorId);
  }

  if (permLevel === 'own_etapa') {
    return data.filter((item) => item.etapaAtual === context.userRole);
  }

  return [];
};

export default {
  getDataFilter,
  canEditResource,
  canPerformAction,
  getModulePermissions,
  filterDataByPermissions,
};
