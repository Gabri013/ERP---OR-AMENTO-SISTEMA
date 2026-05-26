import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { response } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json(
        response.error('Dados inválidos', 'VALIDATION_ERROR', result.error.flatten().fieldErrors),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
