import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

  redisClient.on('error', (err) => logger.error('Redis erreur:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnexion...'));

  await redisClient.connect();
}

export function getRedis(): RedisClientType {
  if (!redisClient) throw new Error('Redis non initialisé. Appelez connectRedis() d\'abord.');
  return redisClient;
}

// Helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await getRedis().get(key);
  return val ? JSON.parse(val) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await getRedis().setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) await getRedis().del(keys);
}
