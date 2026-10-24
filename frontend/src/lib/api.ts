import type {
  ApiErrorBody,
  EmailCounts,
  EmailDetail,
  EmailSummary,
  ListEmailsParams,
  MailboxKind,
  Paginated,
  ScheduleRequest,
  ScheduleResponse,
  Sender,
  User,
} from "@/types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: ApiErrorBody["details"],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQuery(params: object): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const api = {
  me: () => request<User>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  senders: () => request<Sender[]>("/api/senders"),

  counts: () => request<EmailCounts>("/api/emails/counts"),
  listEmails: (kind: MailboxKind, params: ListEmailsParams) =>
    request<Paginated<EmailSummary>>(`/api/emails/${kind}${toQuery(params)}`),
  email: (id: string) => request<EmailDetail>(`/api/emails/${id}`),
  schedule: (body: ScheduleRequest) =>
    request<ScheduleResponse>("/api/emails/schedule", { method: "POST", body: JSON.stringify(body) }),
};

export const GOOGLE_LOGIN_URL = "/auth/google";

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.details?.length ? `${err.message}: ${err.details[0].message}` : err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
