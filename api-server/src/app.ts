import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import compression from "compression";
import swaggerUi from 'swagger-ui-express';
import router from "./routes";
import { logger } from "./lib/logger";
import { loadUser } from "./middleware/auth";
import { applySecurityMiddlewares } from "./middleware/security";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./lib/swagger";

const app: Express = express();

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

applySecurityMiddlewares(app);

// Gzip compression
app.use(compression());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(loadUser);
app.use("/api", router);

// Cache-Control headers for static assets
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ERP Cozinca API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Global error handler
app.use(errorHandler);

export default app;
