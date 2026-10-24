import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, parseLeadsFile } from "@/lib/parseLeads";

const COLLAPSED_CHIPS = 3;
const EXPANDED_CHIPS = 60;

interface RecipientFieldProps {
  id: string;
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export function RecipientField({ id, recipients, onChange }: RecipientFieldProps) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addMany = (emails: string[]) => {
    const merged = new Set(recipients);
    for (const e of emails) merged.add(e.toLowerCase());
    onChange([...merged]);
  };

  const commitDraft = () => {
    const parts = draft.split(/[\s,;]+/).filter(Boolean);
    if (parts.length === 0) return;
    const valid = parts.filter(isValidEmail);
    if (valid.length < parts.length) toast.error("That doesn't look like a valid email address");
    addMany(valid);
    setDraft(valid.length === parts.length ? "" : parts.filter((p) => !isValidEmail(p)).join(" "));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", " ", "Tab"].includes(e.key) && draft.trim()) {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && !draft && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParsing(true);
    try {
      const result = await parseLeadsFile(file);
      if (result.emails.length === 0) {
        toast.error(`No email addresses found in ${file.name}`);
        return;
      }
      addMany(result.emails);
      const skipped = [
        result.duplicates && `${result.duplicates} duplicate${result.duplicates > 1 ? "s" : ""}`,
        result.invalidRows && `${result.invalidRows} row${result.invalidRows > 1 ? "s" : ""} without an email`,
      ].filter(Boolean);
      toast.success(
        `Found ${result.emails.length.toLocaleString()} email addresses in ${file.name}` +
          (skipped.length ? ` (skipped ${skipped.join(", ")})` : ""),
      );
    } catch {
      toast.error("Couldn't read that file");
    } finally {
      setParsing(false);
    }
  };

  const limit = expanded ? EXPANDED_CHIPS : COLLAPSED_CHIPS;
  const visible = recipients.slice(0, limit);
  const hidden = recipients.length - visible.length;

  return (
    <div className="flex w-full items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {visible.map((email) => (
          <span
            key={email}
            className="group inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-2.5 py-0.5 text-xs"
          >
            {email}
            <button
              type="button"
              aria-label={`Remove ${email}`}
              onClick={() => onChange(recipients.filter((r) => r !== email))}
              className="hidden text-muted hover:text-ink group-hover:inline"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-xs"
          >
            +{hidden.toLocaleString()}
          </button>
        )}
        {expanded && recipients.length > COLLAPSED_CHIPS && (
          <button type="button" onClick={() => setExpanded(false)} className="text-xs text-muted hover:text-ink">
            Show less
          </button>
        )}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder={recipients.length ? "" : "recipient@example.com"}
          className="h-7 min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b5b5b5]"
        />
      </div>

      {recipients.length > 0 && (
        <span className="shrink-0 text-xs text-muted">
          {recipients.length.toLocaleString()} {recipients.length === 1 ? "recipient" : "recipients"}
        </span>
      )}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={parsing}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm text-brand hover:underline disabled:opacity-60"
      >
        <Upload className="size-4" />
        {parsing ? "Reading…" : "Upload List"}
      </button>
      <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={onFile} />
    </div>
  );
}
