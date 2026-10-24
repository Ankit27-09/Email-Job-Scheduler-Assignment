import { useState } from "react";
import { Check, Funnel, RotateCw, Search } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import type { EmailStatus } from "@/types/api";

export interface StatusOption {
  value: EmailStatus | undefined;
  label: string;
}

interface MailboxToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: EmailStatus | undefined;
  statusOptions: StatusOption[];
  onStatusChange: (value: EmailStatus | undefined) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function MailboxToolbar({
  search,
  onSearchChange,
  status,
  statusOptions,
  onStatusChange,
  onRefresh,
  refreshing,
}: MailboxToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 pb-2">
      <label className="flex h-9 flex-1 items-center gap-2 rounded-full bg-field px-3.5 text-sm">
        <Search className="size-4 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="h-full flex-1 bg-transparent outline-none placeholder:text-muted"
        />
      </label>

      <Popover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        className="w-40 p-1"
        trigger={
          <IconButton label="Filter by status" active={status !== undefined} onClick={() => setFilterOpen((o) => !o)}>
            <Funnel className={cn("size-4", status && "text-brand")} />
          </IconButton>
        }
      >
        {statusOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              onStatusChange(option.value);
              setFilterOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-field"
          >
            {option.label}
            {option.value === status && <Check className="size-4 text-brand" />}
          </button>
        ))}
      </Popover>

      <IconButton label="Refresh" onClick={onRefresh}>
        <RotateCw className={cn("size-4", refreshing && "animate-spin")} />
      </IconButton>
    </div>
  );
}
