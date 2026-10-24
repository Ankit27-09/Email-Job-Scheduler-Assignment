import { env } from "./config/env";
import { createApp } from "./app";
import { prisma } from "./db/client";
import { createLogger } from "./lib/logger";
import { redis } from "./lib/redis";
import { emailQueue } from "./queue/emailQueue";

const log = createLogger("api");

const server = createApp().listen(env.PORT, () => {
  log.info(`API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  log.info(`received ${signal}, shutting down`);
  server.close();
  await emailQueue.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
