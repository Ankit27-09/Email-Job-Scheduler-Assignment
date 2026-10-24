import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db/client";
import { enqueueEmails } from "../queue/emailQueue";

export const MAX_RECIPIENTS_PER_REQUEST = 10000;

export const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().min(1, "Body is required").max(100_000),
  recipients: z
    .array(z.string().trim().toLowerCase().email())
    .min(1, "Add at least one recipient")
    .max(MAX_RECIPIENTS_PER_REQUEST),
  startAt: z.coerce.date(),
  delaySeconds: z.coerce.number().int().min(0).max(3600),
  hourlyLimit: z.coerce.number().int().min(1).max(10000),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export class NotFoundError extends Error {}

const INSERT_CHUNK = 1000;

export async function scheduleCampaign(userId: string, input: ScheduleInput) {
  const sender = await prisma.sender.findUnique({ where: { id: input.senderId } });
  if (!sender) throw new NotFoundError("Sender not found");

  const recipients = [...new Set(input.recipients)];
  const startAt = new Date(Math.max(input.startAt.getTime(), Date.now()));
  const delayMs = input.delaySeconds * 1000;
  const campaignId = randomUUID();

  // Ideal times assuming no rate limit; the worker pushes them back if a limit is hit.
  const rows = recipients.map((recipient, i) => {
    const at = new Date(startAt.getTime() + i * delayMs);
    return {
      id: randomUUID(),
      campaignId,
      userId,
      senderId: sender.id,
      recipient,
      subject: input.subject,
      body: input.body,
      sequence: i,
      requestedAt: at,
      scheduledAt: at,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.campaign.create({
      data: {
        id: campaignId,
        userId,
        senderId: sender.id,
        subject: input.subject,
        body: input.body,
        startAt,
        delayMs,
        hourlyLimit: input.hourlyLimit,
      },
    });
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      await tx.email.createMany({ data: rows.slice(i, i + INSERT_CHUNK) });
    }
  });

  // Rows are committed first. If enqueueing fails here, startup reconciliation re-adds them.
  await enqueueEmails(rows);

  return {
    campaignId,
    count: rows.length,
    duplicatesRemoved: input.recipients.length - rows.length,
    firstSendAt: rows[0].scheduledAt,
    lastSendAt: rows[rows.length - 1].scheduledAt,
  };
}
