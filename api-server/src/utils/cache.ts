/**
 * Safe cache functions for environments where Redis might not be available
 * These are no-op functions that gracefully handle cache operations
 */

export const safeWithCache = async (key: string, ttl: number, fn: () => Promise<any>) => {
  // In production, this would use actual Redis caching
  // For now, just execute the function without caching
  return fn();
};

export const safeCacheDel = async (key: string) => {
  // In production, this would delete from Redis cache
  // For now, do nothing
};
