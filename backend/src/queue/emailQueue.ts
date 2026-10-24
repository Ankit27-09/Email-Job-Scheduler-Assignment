import { JobsOptions, Queue } from "bullmq";
import { env } from "../config/env";
import { redisOptions } from "../lib/redis";

export const EMAIL_QUEUE_NAME = "email-send";
export const SEND_JOB_NAME = "send-email";

export interface SendEmailJobData {
  emailId: string;
  // Hour window whose quota this job has already consumed.
  quotaWindow?: number;
  // Spacing slot already handed out to this job.
  slot?: number;
}

export const emailQueue = new Queue<SendEmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisOptions(),
  defaultJobOptions: {
    attempts: env.SEND_MAX_ATTEMPTS,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 7 * 24 * 3600, count: 10000 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

/** jobId = email row id, so the same email can never be enqueued twice. */
export function sendJobOptions(emailId: string, scheduledAt: Date): JobsOptions {
  return {
    jobId: emailId,
    delay: Math.max(0, scheduledAt.getTime() - Date.now()),
  };
}

interface EnqueueItem {
  id: string;
  scheduledAt: Date;
  // Set when the hourly quota was already consumed for this email, so it is not counted twice.
  quotaWindow?: number;
}

export async function enqueueEmails(emails: EnqueueItem[], chunkSize = 500) {
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    await emailQueue.addBulk(
      chunk.map((e) => ({
        name: SEND_JOB_NAME,
        data: e.quotaWindow === undefined ? { emailId: e.id } : { emailId: e.id, quotaWindow: e.quotaWindow },
        opts: sendJobOptions(e.id, e.scheduledAt),
      })),
    );
  }
}
