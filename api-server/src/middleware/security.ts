import type { Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export function applySecurityMiddlewares(app: Express) {
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: {
          message: "Muitas requisições. Aguarde 15 minutos.",
          code: "RATE_LIMITED",
          details: null,
        },
      },
    }),
  );

  app.use(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: {
          message: "Muitas tentativas de login.",
          code: "LOGIN_RATE_LIMITED",
          details: null,
        },
      },
    }),
  );
}
