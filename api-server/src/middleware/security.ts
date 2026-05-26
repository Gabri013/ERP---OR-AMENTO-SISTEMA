import type { Express } from "express";
import helmet from "helmet";
import { generalLimiter, loginLimiter } from "./rateLimiter";

export function applySecurityMiddlewares(app: Express) {
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.header("x-forwarded-proto") !== "https") {
        return res.redirect(301, `https://${req.header("host")}${req.url}`);
      }
      next();
    });
  }

  // Apply Redis-backed rate limiting globally
  app.use(generalLimiter);

  // Stricter rate limiting for login endpoint
  app.use("/api/auth/login", loginLimiter);
}
