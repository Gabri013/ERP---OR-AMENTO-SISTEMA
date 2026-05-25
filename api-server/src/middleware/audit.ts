import type { Request, RequestHandler, Response } from "express";
import { db } from "../lib/prisma";

interface AuditOptions {
  action: string;
  module: string;
  recordId?: string | number;
  table?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Middleware de auditoria que registra todas as ações críticas
 */
export function auditLog(options: AuditOptions): RequestHandler {
  return async (req: Request, res: Response, next) => {
    // Captura a resposta original
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Só registra se a operação foi bem-sucedida (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user = (req as any).currentUser;
        
        db.auditLog.create({
          data: {
            usuarioId: user?.id,
            acao: options.action,
            modulo: options.module,
            registroId: options.recordId?.toString(),
            tabela: options.table,
            valorAntigo: options.oldValue ? JSON.stringify(options.oldValue) : null,
            valorNovo: options.newValue ? JSON.stringify(options.newValue) : JSON.stringify(data),
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
          },
        }).catch(err => {
          // Não falhar a requisição se o audit log falhar
          console.error('Audit log error:', err);
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Helper para registrar auditoria manualmente
 */
export async function createAuditLog(options: AuditOptions & { userId?: number }) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId: options.userId,
        acao: options.action,
        modulo: options.module,
        registroId: options.recordId?.toString(),
        tabela: options.table,
        valorAntigo: options.oldValue ? JSON.stringify(options.oldValue) : null,
        valorNovo: options.newValue ? JSON.stringify(options.newValue) : null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
