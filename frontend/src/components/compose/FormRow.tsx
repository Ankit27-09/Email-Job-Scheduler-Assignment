import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FormRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  bordered?: boolean;
}

export function FormRow({ label, htmlFor, children, bordered = true }: FormRowProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={htmlFor} className="w-11 shrink-0 text-sm">
        {label}
      </label>
      <div className={cn("flex min-h-11 min-w-0 flex-1 items-center", bordered && "border-b border-line")}>
        {children}
      </div>
    </div>
  );
}
