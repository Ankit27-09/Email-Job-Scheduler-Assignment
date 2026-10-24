import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBadgeTime } from "@/lib/format";
import type { EmailSummary } from "@/types/api";

const base = "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ email }: { email: Pick<EmailSummary, "status" | "scheduledAt"> }) {
  switch (email.status) {
    case "SCHEDULED":
      return (
        <span className={cn(base, "border-warn-line bg-warn-bg text-warn-ink")}>
          <Clock className="size-3" />
          {formatBadgeTime(email.scheduledAt)}
        </span>
      );
    case "SENDING":
      return (
        <span className={cn(base, "border-warn-line bg-warn-bg text-warn-ink")}>
          <Clock className="size-3 animate-pulse" />
          Sending
        </span>
      );
    case "SENT":
      return <span className={cn(base, "border-line bg-field text-[#555]")}>Sent</span>;
    case "FAILED":
      return <span className={cn(base, "border-red-200 bg-red-50 text-red-600")}>Failed</span>;
  }
}
