import { DelayedError, Job } from "bullmq";
import { prisma } from "../db/client";
import { env } from "../config/env";
import { createLogger } from "../lib/logger";
import { sendEmail } from "../mail/mailer";
import { hourWindowOf, hourWindowStart, reserveHourlyQuota, reserveSpacingSlot } from "../rateLimiter/sendSlots";
import type { SendEmailJobData } from "./emailQueue";

const log = createLogger("worker");

// A reserved slot this close to "now" is treated as due.
const SLOT_TOLERANCE_MS = 50;

type Outcome = "sent" | "skipped" | "failed";

export async function processSendEmail(job: Job<SendEmailJobData>, token?: string): Promise<Outcome> {
  const { emailId } = job.data;

  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { sender: true, campaign: { select: { delayMs: true, hourlyLimit: true } } },
  });

  if (!email) {
    log.warn("email row not found, dropping job", { emailId });
    return "skipped";
  }

  if (email.status === "SENT" || email.status === "FAILED") {
    return "skipped";
  }

  if (email.status === "SENDING") {
    // A previous attempt crashed between claiming and finishing. We cannot know whether
    // the SMTP server accepted the message, so we prefer at-most-once and do not resend.
    await prisma.email.updateMany({
      where: { id: emailId, status: "SENDING" },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        error: "Send was interrupted; not retried to avoid a duplicate",
      },
    });
    log.warn("found interrupted send, marked failed", { emailId });
    return "failed";
  }

  // 1a. Hourly quota. If this hour is full, push the job to the start of the hour that has room.
  const now = Date.now();
  let { quotaWindow, slot } = job.data;

  if (quotaWindow === undefined) {
    quotaWindow = await reserveHourlyQuota({
      senderId: email.senderId,
      campaignId: email.campaignId,
      senderHourlyLimit: env.MAX_EMAILS_PER_HOUR_PER_SENDER,
      campaignHourlyLimit: email.campaign.hourlyLimit,
      now,
    });

    if (quotaWindow > hourWindowOf(now)) {
      // + sequence ms keeps campaign order among jobs released at the same moment.
      const releaseAt = hourWindowStart(quotaWindow) + email.sequence;
      await deferJob(job, token, { emailId, quotaWindow }, releaseAt);
    }
  }

  // 1b. Minimum gap between sends (per sender and per campaign).
  if (slot === undefined) {
    slot = await reserveSpacingSlot({
      senderId: email.senderId,
      campaignId: email.campaignId,
      senderGapMs: env.MIN_DELAY_BETWEEN_SENDS_MS,
      campaignGapMs: email.campaign.delayMs,
      now,
    });
  }
  if (slot > now + SLOT_TOLERANCE_MS) {
    await deferJob(job, token, { emailId, quotaWindow, slot }, slot);
  }

  // 2. Idempotency: only the worker that flips SCHEDULED -> SENDING may send.
  const claim = await prisma.email.updateMany({
    where: { id: emailId, status: "SCHEDULED" },
    data: { status: "SENDING", attempts: { increment: 1 } },
  });
  if (claim.count === 0) {
    return "skipped";
  }

  // 3. Send.
  let result;
  try {
    result = await sendEmail(email.sender, {
      id: email.id,
      to: email.recipient,
      subject: email.subject,
      html: email.body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

    if (isFinalAttempt) {
      await prisma.email.update({
        where: { id: emailId },
        data: { status: "FAILED", failedAt: new Date(), error: message },
      });
      log.error("send failed permanently", { emailId, error: message });
      return "failed";
    }

    // Release the claim; the retry goes through the limiter again (over-counting is the safe side).
    await prisma.email.update({ where: { id: emailId }, data: { status: "SCHEDULED", error: message } });
    await job.updateData({ emailId });
    log.warn("send failed, will retry", { emailId, attempt: job.attemptsMade + 1, error: message });
    throw err;
  }

  await withRetry(() =>
    prisma.email.update({
      where: { id: emailId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        error: null,
      },
    }),
  );

  log.info("sent", { emailId, to: email.recipient, sender: email.sender.email });
  return "sent";
}

async function deferJob(job: Job<SendEmailJobData>, token: string | undefined, data: SendEmailJobData, until: number): Promise<never> {
  await job.updateData(data);
  await prisma.email.update({ where: { id: data.emailId }, data: { scheduledAt: new Date(until) } });
  await job.moveToDelayed(until, token);
  // Tells BullMQ the job was rescheduled on purpose: not completed, not failed.
  throw new DelayedError();
}

// The mail is already out at this point; try hard not to lose the SENT marker.
async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 200 * 2 ** i));
    }
  }
  throw lastError;
}
