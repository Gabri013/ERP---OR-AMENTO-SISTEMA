import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { initSocket } from "./lib/socket";
import { startAlertScheduler } from "./services/alerts.service";
import { logger } from "./lib/logger";

// Load .env for local development
if (!process.env.VERCEL) {
  dotenv.config();
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
    httpServer.listen(port, () => {
      logger.info({ port }, `Server listening on port ${port}`);
    });
  }
}
