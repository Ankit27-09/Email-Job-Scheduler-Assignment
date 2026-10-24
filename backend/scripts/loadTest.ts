/*
 * Schedules a large batch for the same start time to exercise the limiter.
 *   npm run load-test -- <count> <hourlyLimit> <delaySeconds>
 *   npm run load-test -- 1000 20 0
 *
 * Uses the first user who has logged in and the first sender. Start a worker to see
 * the first <hourlyLimit> go out and the rest get pushed into the following hours.
 */
import { prisma } from "../src/db/client";
import { emailQueue } from "../src/queue/emailQueue";
import { redis } from "../src/lib/redis";
import { scheduleCampaign } from "../src/services/schedule.service";

async function main() {
  const count = Number(process.argv[2] ?? 1000);
  const hourlyLimit = Number(process.argv[3] ?? 20);
  const delaySeconds = Number(process.argv[4] ?? 0);

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  const sender = await prisma.sender.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("Log in through the frontend once so a user exists");
  if (!sender) throw new Error("Run `npm run senders:create` first");

  const recipients = Array.from({ length: count }, (_, i) => `lead${i + 1}@example.com`);

  const started = Date.now();
  const result = await scheduleCampaign(user.id, {
    senderId: sender.id,
    subject: `Load test (${count} emails)`,
    body: "<p>Hello from the load test.</p>",
    recipients,
    startAt: new Date(),
    delaySeconds,
    hourlyLimit,
  });

  console.log(`scheduled ${result.count} emails in ${Date.now() - started} ms`);
  console.log(`campaign ${result.campaignId}, hourly limit ${hourlyLimit}, delay ${delaySeconds}s`);
  console.log("job counts:", await emailQueue.getJobCounts("delayed", "waiting", "active", "completed"));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await emailQueue.close();
    await redis.quit();
    await prisma.$disconnect();
  });
