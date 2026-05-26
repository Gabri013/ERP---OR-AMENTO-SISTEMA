import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../lib/logger';

/**
 * Middleware para validar body da requisição com Zod
 * @param schema - Schema Zod para validação
 * @returns Middleware Express
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          msg: 'Validação de body falhou',
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        return res.status(400).json({
          error: 'Validação falhou',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      logger.error({
        msg: 'Erro ao validar body',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({ error: 'Erro ao validar dados' });
    }
  };
};

/**
 * Middleware para validar query parameters com Zod
 * @param schema - Schema Zod para validação
 * @returns Middleware Express
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validação de query falhou',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      res.status(500).json({ error: 'Erro ao validar query' });
    }
  };
};

/**
 * Middleware para validar URL parameters com Zod
 * @param schema - Schema Zod para validação
 * @returns Middleware Express
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validação de parâmetros falhou',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      res.status(500).json({ error: 'Erro ao validar parâmetros' });
    }
  };
};

/**
 * Helper para validação manual em handlers
 * @param data - Dados a validar
 * @param schema - Schema Zod
 * @returns Dados validados ou null em caso de erro
 */
export const validate = async <T>(data: any, schema: ZodSchema): Promise<T | null> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Validação falhou', { errors: error.errors });
    }
    return null;
  }
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
};
