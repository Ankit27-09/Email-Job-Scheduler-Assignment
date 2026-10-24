import type { EmailStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/client";

export type EmailListKind = "scheduled" | "sent";

const STATUSES: Record<EmailListKind, EmailStatus[]> = {
  scheduled: ["SCHEDULED", "SENDING"],
  sent: ["SENT", "FAILED"],
};

export interface ListParams {
  userId: string;
  kind: EmailListKind;
  search?: string;
  // Narrows within the kind; a status from the other kind yields nothing.
  status?: EmailStatus;
  page: number;
  pageSize: number;
}

function toPreview(html: string, max = 140): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function listEmails({ userId, kind, search, status, page, pageSize }: ListParams) {
  const statuses = status ? STATUSES[kind].filter((s) => s === status) : STATUSES[kind];
  const where: Prisma.EmailWhereInput = {
    userId,
    status: { in: statuses },
    ...(search
      ? {
          OR: [
            { recipient: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.EmailOrderByWithRelationInput[] =
    kind === "scheduled" ? [{ scheduledAt: "asc" }, { sequence: "asc" }] : [{ updatedAt: "desc" }];

  const [rows, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { sender: { select: { email: true, name: true } } },
    }),
    prisma.email.count({ where }),
  ]);

  return {
    items: rows.map((e) => ({
      id: e.id,
      recipient: e.recipient,
      subject: e.subject,
      preview: toPreview(e.body),
      status: e.status,
      requestedAt: e.requestedAt,
      scheduledAt: e.scheduledAt,
      sentAt: e.sentAt,
      failedAt: e.failedAt,
      error: e.error,
      sender: e.sender,
    })),
    total,
    page,
    pageSize,
  };
}

export async function countEmails(userId: string) {
  const grouped = await prisma.email.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const counts = { scheduled: 0, sent: 0 };
  for (const g of grouped) {
    if (STATUSES.scheduled.includes(g.status)) counts.scheduled += g._count._all;
    else counts.sent += g._count._all;
  }
  return counts;
}

export async function getEmail(userId: string, id: string) {
  return prisma.email.findFirst({
    where: { id, userId },
    select: {
      id: true,
      recipient: true,
      subject: true,
      body: true,
      status: true,
      requestedAt: true,
      scheduledAt: true,
      sentAt: true,
      failedAt: true,
      error: true,
      previewUrl: true,
      attempts: true,
      sender: { select: { email: true, name: true } },
    },
  });
}
