import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  backTo?: string;
}

/** Full-width header with a back arrow, used by the compose and email detail pages. */
export function PageHeader({ title, actions, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3 px-2 py-3">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        className="rounded-md p-1 text-ink hover:bg-field"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-xl">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
