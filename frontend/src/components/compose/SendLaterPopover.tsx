import { useState } from "react";
import { addDays, format, setHours, setMinutes, startOfMinute } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { toDateTimeLocal } from "@/lib/format";

function tomorrowAt(hour?: number): Date {
  const base = startOfMinute(addDays(new Date(), 1));
  return hour === undefined ? base : setMinutes(setHours(base, hour), 0);
}

const PRESETS: { label: string; get: () => Date }[] = [
  { label: "Tomorrow", get: () => tomorrowAt() },
  { label: "Tomorrow, 10:00 AM", get: () => tomorrowAt(10) },
  { label: "Tomorrow, 11:00 AM", get: () => tomorrowAt(11) },
  { label: "Tomorrow, 3:00 PM", get: () => tomorrowAt(15) },
];

interface SendLaterPopoverProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
}

export function SendLaterPopover({ value, onChange }: SendLaterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openPopover = () => {
    setDraft(value ? toDateTimeLocal(value) : "");
    setOpen(true);
  };

  const done = () => {
    const picked = draft ? new Date(draft) : null;
    if (picked && picked.getTime() < Date.now() - 60_000) return;
    onChange(picked);
    setOpen(false);
  };

  const draftInPast = Boolean(draft) && new Date(draft).getTime() < Date.now() - 60_000;

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="w-64 p-4"
      trigger={
        <IconButton
          label={value ? `Sending ${format(value, "EEE, MMM d h:mm a")}` : "Send later"}
          onClick={() => (open ? setOpen(false) : openPopover())}
          className={cn(value && "text-brand hover:text-brand")}
        >
          <Clock className="size-5" />
        </IconButton>
      }
    >
      <h2 className="mb-3 text-[15px] font-medium">Send Later</h2>
      <input
        type="datetime-local"
        aria-label="Pick date & time"
        value={draft}
        min={toDateTimeLocal(new Date())}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full border-b border-line pb-2 text-sm text-ink outline-none focus:border-brand"
      />
      {draftInPast && <p className="mt-1 text-xs text-red-600">Pick a time in the future</p>}

      <ul className="mt-3 flex flex-col">
        {PRESETS.map((preset) => (
          <li key={preset.label}>
            <button
              type="button"
              onClick={() => setDraft(toDateTimeLocal(preset.get()))}
              className="w-full rounded-md px-1 py-2 text-left text-sm hover:bg-field"
            >
              {preset.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-end gap-2">
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-auto text-muted"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={done} disabled={draftInPast}>
          Done
        </Button>
      </div>
    </Popover>
  );
}
