import { Worker } from "bullmq";
import { env } from "./config/env";
import { prisma } from "./db/client";
import { createLogger } from "./lib/logger";
import { redis, redisOptions } from "./lib/redis";
import { closeTransports } from "./mail/mailer";
import { EMAIL_QUEUE_NAME, emailQueue, SendEmailJobData } from "./queue/emailQueue";
import { processSendEmail } from "./queue/emailProcessor";
import { reconcileScheduledEmails } from "./queue/reconcile";

const log = createLogger("worker");

async function main() {
  await reconcileScheduledEmails();

  const worker = new Worker<SendEmailJobData>(EMAIL_QUEUE_NAME, processSendEmail, {
    connection: redisOptions(),
    concurrency: env.WORKER_CONCURRENCY,
  });

  worker.on("failed", (job, err) => {
    log.warn("job failed", { jobId: job?.id, attemptsMade: job?.attemptsMade, error: err.message });
  });
  worker.on("error", (err) => log.error("worker error", { error: err.message }));

  log.info("worker started", {
    concurrency: env.WORKER_CONCURRENCY,
    minDelayMs: env.MIN_DELAY_BETWEEN_SENDS_MS,
    maxPerHourPerSender: env.MAX_EMAILS_PER_HOUR_PER_SENDER,
  });

  const shutdown = async (signal: string) => {
    log.info(`received ${signal}, finishing active jobs`);
    // close() waits for in-flight jobs; delayed jobs stay in Redis for the next start.
    await worker.close();
    await emailQueue.close();
    closeTransports();
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error("worker failed to start", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
