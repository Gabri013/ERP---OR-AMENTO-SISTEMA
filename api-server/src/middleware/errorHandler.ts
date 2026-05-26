import type { Request, Response, NextFunction } from "express";
import { response } from "../utils/response";
import { AppError } from "../utils/errors";
import { logger } from "../lib/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(response.error(err.message, err.code, err.details));
  }

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");

  const detail = err instanceof Error ? err.message : String(err);
  return res
    .status(500)
    .json(
      response.error(
        "Erro interno do servidor",
        "INTERNAL_SERVER_ERROR",
        detail,
      ),
    );
}
