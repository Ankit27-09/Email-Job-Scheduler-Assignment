/*
 * Creates Ethereal SMTP accounts and stores them as senders.
 *   npm run senders:create            -> 2 senders
 *   npm run senders:create -- 3       -> 3 senders
 */
import nodemailer from "nodemailer";
import { prisma } from "../src/db/client";

// nodemailer caches one test account per process by default; we want a fresh one each call.
process.env.ETHEREAL_CACHE = "no";

const DISPLAY_NAMES = ["Growth Team", "Founder Desk", "Partnerships", "Customer Success", "Events"];

async function main() {
  const count = Number(process.argv[2] ?? 2);
  const existing = await prisma.sender.count();

  for (let i = 0; i < count; i++) {
    const account = await nodemailer.createTestAccount();
    const sender = await prisma.sender.create({
      data: {
        name: DISPLAY_NAMES[(existing + i) % DISPLAY_NAMES.length],
        email: account.user,
        smtpHost: account.smtp.host,
        smtpPort: account.smtp.port,
        smtpUser: account.user,
        smtpPass: account.pass,
      },
    });
    console.log(`created sender ${sender.name} <${sender.email}>  (login at https://ethereal.email with pass ${account.pass})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
