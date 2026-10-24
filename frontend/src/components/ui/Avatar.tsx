import { useState } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
