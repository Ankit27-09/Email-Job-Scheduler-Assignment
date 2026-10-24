import { ReactNode, useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Anchored panel that closes on outside click or Escape. */
export function Popover({ open, onClose, trigger, children, align = "right", className }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute top-full z-30 mt-2 rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
