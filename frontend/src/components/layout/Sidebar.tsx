import type { ComponentType } from "react";
import { Link, NavLink } from "react-router-dom";
import { Clock, Send } from "lucide-react";
import { useEmailCounts } from "@/hooks/useEmails";
import { cn } from "@/lib/cn";
import type { User } from "@/types/api";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

interface NavItemProps {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
}

function NavItem({ to, label, icon: Icon, count }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive ? "bg-brand-soft font-semibold" : "hover:bg-field",
        )
      }
    >
      <Icon className="size-4" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs font-normal text-muted">{count.toLocaleString()}</span>}
    </NavLink>
  );
}

export function Sidebar({ user }: { user: User }) {
  const { data: counts } = useEmailCounts();

  return (
    <aside className="flex w-[200px] shrink-0 flex-col gap-3 px-1 pt-2">
      <div className="px-2 pb-1">
        <Logo />
      </div>
      <UserMenu user={user} />
      <Link
        to="/compose"
        className="flex h-9 items-center justify-center rounded-full border border-brand text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
      >
        Compose
      </Link>

      <nav className="mt-2 flex flex-col gap-0.5">
        <span className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">Core</span>
        <NavItem to="/scheduled" label="Scheduled" icon={Clock} count={counts?.scheduled} />
        <NavItem to="/sent" label="Sent" icon={Send} count={counts?.sent} />
      </nav>
    </aside>
  );
}
