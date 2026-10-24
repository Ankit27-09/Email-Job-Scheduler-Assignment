import { useMemo } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { AlertCircle, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/emails/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useAuth";
import { useEmail } from "@/hooks/useEmails";
import { errorMessage } from "@/lib/api";
import { formatFullDate, formatShortDate } from "@/lib/format";
import type { EmailDetail } from "@/types/api";

function deliveryLine(email: EmailDetail): string {
  switch (email.status) {
    case "SCHEDULED":
      return email.scheduledAt !== email.requestedAt
        ? `Scheduled for ${formatFullDate(email.scheduledAt)} (moved from ${formatFullDate(email.requestedAt)} by rate limits)`
        : `Scheduled for ${formatFullDate(email.scheduledAt)}`;
    case "SENDING":
      return "Sending now…";
    case "SENT":
      return `Sent ${formatFullDate(email.sentAt!)}`;
    case "FAILED":
      return `Failed ${email.failedAt ? formatFullDate(email.failedAt) : ""}${email.error ? ` - ${email.error}` : ""}`;
  }
}

export function EmailDetailPage() {
  const { id = "" } = useParams();
  const { data: email, isPending, error } = useEmail(id);
  const { data: user } = useCurrentUser();
  const safeBody = useMemo(() => (email ? DOMPurify.sanitize(email.body) : ""), [email]);

  if (isPending) return <FullPageSpinner />;

  const userAvatar = user && <Avatar name={user.name} src={user.avatarUrl} />;

  if (error || !email) {
    return (
      <div className="h-full">
        <PageHeader title="Email" backTo="/scheduled" actions={userAvatar} />
        <EmptyState icon={<AlertCircle className="size-5" />} title="Email not found" description={errorMessage(error)} />
      </div>
    );
  }

  const backTo = email.status === "SENT" || email.status === "FAILED" ? "/sent" : "/scheduled";
  const shownAt = email.sentAt ?? email.failedAt ?? email.scheduledAt;

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title={email.subject} backTo={backTo} actions={userAvatar} />

      <article className="mx-auto max-w-[860px] px-6 pt-4 pb-16">
        <div className="flex items-start gap-3">
          <Avatar name={email.sender.name} className="size-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-semibold">{email.sender.name}</span>{" "}
              <span className="text-xs text-muted">&lt;{email.sender.email}&gt;</span>
            </p>
            <p className="text-xs text-muted">to {email.recipient}</p>
          </div>
          <time className="shrink-0 text-xs text-muted" dateTime={shownAt}>
            {formatShortDate(shownAt)}
          </time>
        </div>

        <div className="mt-4 ml-12 flex flex-wrap items-center gap-2 rounded-lg bg-field px-3 py-2 text-xs text-muted">
          <StatusBadge email={email} />
          <span>{deliveryLine(email)}</span>
          {email.previewUrl && (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-brand hover:underline"
            >
              View on Ethereal <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        <div className="prose-email mt-6 ml-12 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: safeBody }} />
      </article>
    </div>
  );
}
