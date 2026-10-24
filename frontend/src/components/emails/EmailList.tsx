import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { errorMessage } from "@/lib/api";
import type { EmailSummary } from "@/types/api";
import { EmailRow, EmailRowSkeleton } from "./EmailRow";

interface EmailListProps {
  emails: EmailSummary[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  empty: ReactNode;
}

export function EmailList({ emails, isLoading, error, onRetry, hasMore, isLoadingMore, onLoadMore, empty }: EmailListProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading emails">
        {Array.from({ length: 6 }, (_, i) => (
          <EmailRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="size-5" />}
        title="Couldn't load emails"
        description={errorMessage(error)}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (emails.length === 0) return <>{empty}</>;

  return (
    <div>
      {emails.map((email) => (
        <EmailRow key={email.id} email={email} />
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" size="sm" loading={isLoadingMore} onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
