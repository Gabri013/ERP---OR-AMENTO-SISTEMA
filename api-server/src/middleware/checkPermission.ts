import { Request, Response, NextFunction } from 'express';
import { TipoUsuario } from '@prisma/client';
import { hasPermission, getPermissionLevel, PermissionLevel } from '../lib/permissions';
import { logger } from '../lib/logger';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo: TipoUsuario;
    setorId?: number;
  };
  permissionLevel?: PermissionLevel | boolean;
}

/**
 * Middleware que verifica se usuário tem permissão para uma ação
 *
 * Uso:
 * router.post('/endpoint', checkPermission('modulo', 'acao'), handler)
 * router.get('/endpoint', checkPermission('modulo', 'visualizar'), handler)
 */
export const checkPermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn({
        msg: 'Acesso sem autenticação',
        path: req.path,
        module,
        action,
      });
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = req.user.tipo;
    const hasAccess = hasPermission(userRole, module, action);

    if (!hasAccess) {
      logger.warn({
        msg: 'Acesso negado - permissão insuficiente',
        userId: req.user.id,
        userRole,
        module,
        action,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: `Você não tem permissão para ${action} em ${module}`,
        details: {
          module,
          action,
          userRole,
        },
      });
    }

    // Armazenar nível de permissão para usar na lógica da rota
    const permLevel = getPermissionLevel(userRole, module, action);
    req.permissionLevel = permLevel;

    logger.debug({
      msg: 'Permissão verificada com sucesso',
      userId: req.user.id,
      userRole,
      module,
      action,
      permissionLevel: permLevel,
    });

    next();
  };
};

/**
 * Middleware que verifica múltiplas permissões (qualquer uma vale - OR logic)
 *
 * Uso:
 * router.get('/dados', checkAnyPermission([
 *   ['vendas', 'visualizar'],
 *   ['financeiro', 'visualizar'],
 * ]), handler)
 */
export const checkAnyPermission = (
  permissions: [string, string][]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = req.user.tipo;
    const hasAnyAccess = permissions.some(([module, action]) =>
      hasPermission(userRole, module, action)
    );

    if (!hasAnyAccess) {
      logger.warn({
        msg: 'Acesso negado - nenhuma permissão atende',
        userId: req.user.id,
        userRole,
        requiredPermissions: permissions,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso',
        requiredPermissions: permissions,
      });
    }

    next();
  };
};

/**
 * Middleware que verifica múltiplas permissões (todas devem atender - AND logic)
 *
 * Uso:
 * router.post('/action', checkAllPermissions([
 *   ['vendas', 'criar'],
 *   ['financeiro', 'fazer_pagamento'],
 * ]), handler)
 */
export const checkAllPermissions = (
  permissions: [string, string][]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = req.user.tipo;
    const hasAllAccess = permissions.every(([module, action]) =>
      hasPermission(userRole, module, action)
    );

    if (!hasAllAccess) {
      logger.warn({
        msg: 'Acesso negado - não atende todas as permissões',
        userId: req.user.id,
        userRole,
        requiredPermissions: permissions,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não atende todos os critérios de permissão',
        requiredPermissions: permissions,
      });
    }

    next();
  };
};

/**
 * Middleware que verifica se é um role específico
 *
 * Uso:
 * router.get('/admin', checkRole(['master', 'gerente']), handler)
 */
export const checkRole = (allowedRoles: TipoUsuario[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const isAllowed = allowedRoles.includes(req.user.tipo);

    if (!isAllowed) {
      logger.warn({
        msg: 'Acesso negado - role não permitido',
        userId: req.user.id,
        userRole: req.user.tipo,
        allowedRoles,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: `Seu role não tem acesso a este recurso`,
        allowedRoles,
      });
    }

    next();
  };
};

export default {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRole,
};
