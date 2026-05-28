import dotenv from "dotenv";
import http from "http";
import { Pool } from "pg";
import app from "./app";
import { initSocket } from "./lib/socket";
import { startAlertScheduler } from "./services/alerts.service";
import { logger } from "./lib/logger";

// Load .env for local development
if (!process.env.VERCEL) {
  dotenv.config();
}

// Apply missing DB enum values that may not have been included in older migrations.
// Uses DIRECT_URL (bypasses pgbouncer) so DDL always works.
async function applyEnumPatches(): Promise<void> {
  const connStr = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connStr) return;
  const pool = new Pool({ connectionString: connStr });
  const missing = [
    "embalagem",
    "autorizacao",
    "acabamento",
    "finalizacao",
    "concluida",
  ];
  try {
    for (const val of missing) {
      await pool.query(
        `DO $$ BEGIN ALTER TYPE "EtapaProducao" ADD VALUE IF NOT EXISTS '${val}'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      );
    }
    logger.info("Enum patches applied (EtapaProducao)");
  } catch (err) {
    logger.error({ err }, "Enum patch failed — server will still start");
  } finally {
    await pool.end();
  }
}

// Create HTTP server so socket.io can attach
const httpServer = http.createServer(app);

// Initialize socket.io
initSocket(httpServer);

// Start background alert scheduler
startAlertScheduler(5 * 60 * 1000); // Check every 5 minutes

// Export app for Vercel serverless (fallback, socket.io won't work in serverless)
export default app;

// Start listening for Render / local dev
if (!process.env.VERCEL) {
  const rawPort = process.env["PORT"] || "3001";
  const port = Number(rawPort);

  if (!Number.isNaN(port) && port > 0) {
    // Apply DB enum patches before accepting traffic
    applyEnumPatches().finally(() => {
      httpServer.listen(port, () => {
        logger.info({ port }, `Server listening on port ${port}`);
      });
    });
  }
}
