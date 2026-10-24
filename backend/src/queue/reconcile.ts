import { prisma } from "../db/client";
import { createLogger } from "../lib/logger";
import { hourWindowOf } from "../rateLimiter/sendSlots";
import { emailQueue, enqueueEmails } from "./emailQueue";

const log = createLogger("reconcile");
const BATCH = 500;

/*
 * Postgres is the source of truth. On startup, make sure every email that is still
 * SCHEDULED has a live job in Redis. Normally BullMQ's own persistence already covers
 * restarts and this finds nothing; it exists for the cases where Redis lost data or
 * the API crashed between committing rows and enqueueing them.
 *
 * Safe to run from several processes at once: jobId = email id, so re-adding an
 * existing job is a no-op.
 */
export async function reconcileScheduledEmails(): Promise<number> {
  let restored = 0;
  let cursor: string | undefined;

  for (;;) {
    const rows = await prisma.email.findMany({
      where: { status: "SCHEDULED" },
      select: { id: true, scheduledAt: true, requestedAt: true },
      orderBy: { id: "asc" },
      take: BATCH,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;

    const missing: typeof rows = [];
    await Promise.all(
      rows.map(async (row) => {
        const job = await emailQueue.getJob(row.id);
        if (!job) {
          missing.push(row);
          return;
        }
        // A finished job for a row that is still SCHEDULED is stale; replace it.
        const state = await job.getState();
        if (state === "completed" || state === "failed") {
          await job.remove();
          missing.push(row);
        }
      }),
    );

    if (missing.length > 0) {
      // A row whose time was moved by the limiter has already consumed hourly quota.
      await enqueueEmails(
        missing.map((row) => ({
          id: row.id,
          scheduledAt: row.scheduledAt,
          quotaWindow:
            row.scheduledAt.getTime() !== row.requestedAt.getTime()
              ? hourWindowOf(row.scheduledAt.getTime())
              : undefined,
        })),
      );
      restored += missing.length;
    }
  }

  await failOrphanedSends();

  if (restored > 0) log.info("re-enqueued scheduled emails", { restored });
  else log.info("queue already in sync with database");
  return restored;
}

// SENDING rows with no job left can only come from lost Redis data mid-send.
async function failOrphanedSends() {
  const rows = await prisma.email.findMany({ where: { status: "SENDING" }, select: { id: true } });
  for (const row of rows) {
    const job = await emailQueue.getJob(row.id);
    if (job) continue;
    await prisma.email.updateMany({
      where: { id: row.id, status: "SENDING" },
      data: { status: "FAILED", failedAt: new Date(), error: "Send outcome unknown after restart" },
    });
    log.warn("marked orphaned send as failed", { emailId: row.id });
  }
}
