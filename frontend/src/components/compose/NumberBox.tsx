interface NumberBoxProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  max?: number;
}

/** Small "00" numeric box from the compose design (delay / hourly limit). */
export function NumberBox({ id, label, value, onChange, suffix, max }: NumberBoxProps) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        placeholder="00"
        maxLength={max ? String(max).length : 5}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="h-8 w-14 rounded-lg border border-line px-2.5 text-sm outline-none placeholder:text-[#c4c4c4] focus:border-brand"
      />
      {suffix && <span className="text-xs text-muted">{suffix}</span>}
    </div>
  );
}
