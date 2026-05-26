import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { getRedisClient } from "../lib/redis";

const router: IRouter = Router();

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Basic health check
 *     description: Simple health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/healthz", async (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check
 *     description: Checks database and Redis connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services are healthy
 *       503:
 *         description: One or more services are unhealthy
 */
router.get("/api/health", async (_req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    health.services.database = "ok";
  } catch (error) {
    health.services.database = "error";
    health.status = "degraded";
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.set("health:check", "ok");
      await redis.del("health:check");
      health.services.redis = "ok";
    } else {
      health.services.redis = "not_configured";
    }
  } catch (error) {
    health.services.redis = "error";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
