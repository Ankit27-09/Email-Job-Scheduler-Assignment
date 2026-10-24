import nodemailer, { Transporter } from "nodemailer";
import type { Sender } from "@prisma/client";

// One pooled transport per sender, reused across concurrent jobs in this process.
const transports = new Map<string, Transporter>();

function getTransport(sender: Sender): Transporter {
  let transport = transports.get(sender.id);
  if (!transport) {
    transport = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpPort === 465,
      auth: { user: sender.smtpUser, pass: sender.smtpPass },
      pool: true,
      maxConnections: 3,
    });
    transports.set(sender.id, transport);
  }
  return transport;
}

export interface OutgoingEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendEmail(sender: Sender, email: OutgoingEmail): Promise<SendResult> {
  const info = await getTransport(sender).sendMail({
    from: { name: sender.name, address: sender.email },
    to: email.to,
    subject: email.subject,
    html: email.html,
    // Stable Message-ID per email row, so any duplicate would be recognisable downstream.
    messageId: `<${email.id}@scheduler.local>`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  return { messageId: info.messageId, previewUrl: preview || null };
}

export function closeTransports() {
  for (const t of transports.values()) t.close();
  transports.clear();
}
