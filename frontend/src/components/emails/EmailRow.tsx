import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import type { EmailSummary } from "@/types/api";
import { StatusBadge } from "./StatusBadge";

export function EmailRow({ email }: { email: EmailSummary }) {
  const finishedAt = email.sentAt ?? email.failedAt;

  return (
    <Link
      to={`/emails/${email.id}`}
      className="group flex items-center gap-4 border-b border-line px-5 py-3.5 text-sm transition-colors hover:bg-[#fafafa]"
    >
      <span className="w-40 shrink-0 truncate" title={email.recipient}>
        To: {email.recipient}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <StatusBadge email={email} />
        <span className="truncate">
          <span className="font-medium">{email.subject}</span>
          {email.preview && <span className="text-muted"> - {email.preview}</span>}
        </span>
      </span>

      {finishedAt && (
        <time className="shrink-0 text-xs text-muted" dateTime={finishedAt} title={email.error ?? undefined}>
          {formatShortDate(finishedAt)}
        </time>
      )}
      <Star aria-hidden className="size-4 shrink-0 text-[#c4c4c4]" />
    </Link>
  );
}

export function EmailRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 border-b border-line px-5 py-4">
      <span className="h-3.5 w-32 rounded bg-field" />
      <span className="h-5 w-24 rounded-full bg-field" />
      <span className="h-3.5 flex-1 rounded bg-field" />
    </div>
  );
}
