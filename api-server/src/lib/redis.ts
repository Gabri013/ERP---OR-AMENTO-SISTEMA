let redisClient: any = null;

function getRedisClient() {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) return null;
  if (redisClient) return redisClient;

  try {
    // Dynamic import to avoid breaking if not installed
    const { Redis } = require("@upstash/redis");
    redisClient = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    return redisClient;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return (await client.get(key)) as T | null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 60,
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // cache failure never breaks main flow
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch {}
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fn();
  await cacheSet(key, data, ttlSeconds);
  return data;
}
