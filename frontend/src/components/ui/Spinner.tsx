import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn("size-5 animate-spin", className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center text-brand" role="status" aria-label="Loading">
      <Spinner className="size-7" />
    </div>
  );
}
