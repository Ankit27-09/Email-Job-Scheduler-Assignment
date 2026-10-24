import { format, isThisYear, isToday } from "date-fns";

/** "Tue 9:15:12 AM" - the badge format used in the scheduled list. */
export const formatBadgeTime = (iso: string) => format(new Date(iso), "EEE h:mm:ss a");

/** "Nov 3, 10:23 AM", or "10:23 AM" for today. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  return format(d, isThisYear(d) ? "MMM d, h:mm a" : "MMM d yyyy, h:mm a");
}

export const formatFullDate = (iso: string) => format(new Date(iso), "EEE, MMM d yyyy 'at' h:mm:ss a");

/** Value for <input type="datetime-local"> in the user's timezone. */
export const toDateTimeLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

export function initials(nameOrEmail: string): string {
  const parts = nameOrEmail.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}
