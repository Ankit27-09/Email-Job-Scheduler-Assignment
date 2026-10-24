import Redis from "ioredis";
import { env } from "../config/env";

/*
 * Connection options (not instances) are handed to BullMQ so it owns and closes
 * its own connections. maxRetriesPerRequest: null is required by BullMQ workers.
 * The return type is left inferred so it fits both ioredis and BullMQ option types.
 */
export function redisOptions() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

// Shared connection for plain commands (rate limiter scripts, health checks).
export const redis = new Redis(redisOptions());
