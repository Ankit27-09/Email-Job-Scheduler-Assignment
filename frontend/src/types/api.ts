export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface Sender {
  id: string;
  name: string;
  email: string;
}

export type EmailStatus = "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
export type MailboxKind = "scheduled" | "sent";

export interface EmailSummary {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  status: EmailStatus;
  requestedAt: string;
  scheduledAt: string;
  sentAt: string | null;
  failedAt: string | null;
  error: string | null;
  sender: Pick<Sender, "name" | "email">;
}

export interface EmailDetail extends Omit<EmailSummary, "preview"> {
  body: string;
  previewUrl: string | null;
  attempts: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmailCounts {
  scheduled: number;
  sent: number;
}

export interface ListEmailsParams {
  search?: string;
  status?: EmailStatus;
  page?: number;
  pageSize?: number;
}

export interface ScheduleRequest {
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startAt: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface ScheduleResponse {
  campaignId: string;
  count: number;
  duplicatesRemoved: number;
  firstSendAt: string;
  lastSendAt: string;
}

export interface ApiErrorBody {
  error: string;
  details?: { path: string; message: string }[];
}
