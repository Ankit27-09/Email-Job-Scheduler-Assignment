import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";
import { Spinner } from "@/components/ui/Spinner";
import { useLogout } from "@/hooks/useAuth";
import type { User } from "@/types/api";

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="left"
      className="w-full p-1"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-xl bg-field px-2.5 py-2 text-left transition-colors hover:bg-[#eceeec]"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-[11px] text-muted">{user.email}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted" />
        </button>
      }
    >
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        {logout.isPending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
        Log out
      </button>
    </Popover>
  );
}
