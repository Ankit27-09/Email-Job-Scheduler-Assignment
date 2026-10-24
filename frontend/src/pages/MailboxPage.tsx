import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Send } from "lucide-react";
import { EmailList } from "@/components/emails/EmailList";
import { MailboxToolbar, StatusOption } from "@/components/emails/MailboxToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEmailList } from "@/hooks/useEmails";
import type { EmailStatus, MailboxKind } from "@/types/api";

const CONFIG: Record<MailboxKind, { statusOptions: StatusOption[]; emptyTitle: string; emptyText: string; icon: ReactNode }> = {
  scheduled: {
    statusOptions: [
      { value: undefined, label: "All" },
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "SENDING", label: "Sending" },
    ],
    emptyTitle: "No scheduled emails",
    emptyText: "Emails you schedule will wait here until it's their turn to go out.",
    icon: <Clock className="size-5" />,
  },
  sent: {
    statusOptions: [
      { value: undefined, label: "All" },
      { value: "SENT", label: "Sent" },
      { value: "FAILED", label: "Failed" },
    ],
    emptyTitle: "No sent emails yet",
    emptyText: "Once scheduled emails go out, they'll show up here with their delivery status.",
    icon: <Send className="size-5" />,
  },
};

export function MailboxPage({ kind }: { kind: MailboxKind }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmailStatus | undefined>();
  const debouncedSearch = useDebouncedValue(search.trim());
  const config = CONFIG[kind];

  const query = useEmailList(kind, { search: debouncedSearch, status });
  const emails = query.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = Boolean(debouncedSearch || status);

  return (
    <div className="flex h-full flex-col">
      <MailboxToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        statusOptions={config.statusOptions}
        onStatusChange={setStatus}
        onRefresh={() => query.refetch()}
        refreshing={query.isRefetching}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmailList
          emails={emails}
          isLoading={query.isPending}
          error={query.isError ? query.error : null}
          onRetry={() => query.refetch()}
          hasMore={query.hasNextPage}
          isLoadingMore={query.isFetchingNextPage}
          onLoadMore={() => query.fetchNextPage()}
          empty={
            filtered ? (
              <EmptyState icon={config.icon} title="No matching emails" description="Try a different search or filter." />
            ) : (
              <EmptyState
                icon={config.icon}
                title={config.emptyTitle}
                description={config.emptyText}
                action={
                  <Link
                    to="/compose"
                    className="inline-flex h-9 items-center rounded-full border border-brand px-5 text-sm font-medium text-brand hover:bg-brand-soft"
                  >
                    Compose
                  </Link>
                }
              />
            )
          }
        />
      </div>
    </div>
  );
}
