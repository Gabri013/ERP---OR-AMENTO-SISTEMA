import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { initSocket } from "./lib/socket";
import { logger } from "./lib/logger";

// Load .env for local development
if (!process.env.VERCEL) {
  dotenv.config();
}

// Create HTTP server so socket.io can attach
const httpServer = http.createServer(app);

// Initialize socket.io
initSocket(httpServer);

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
