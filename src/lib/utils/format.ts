import type { RelativeDue } from "@/types/domain";
import { differenceInCalendarDays, format, isToday, isTomorrow, isYesterday } from "date-fns";

export function relativeDue(iso: string, now = new Date()): RelativeDue {
  const d = new Date(iso);
  const days = differenceInCalendarDays(d, now);
  const tone = d.getTime() < now.getTime() ? "overdue" : days <= 1 ? "soon" : "later";
  if (isToday(d)) return { label: `today ${format(d, "HH:mm")}`, tone };
  if (isTomorrow(d)) return { label: "tomorrow", tone };
  if (isYesterday(d)) return { label: "yesterday", tone };
  if (Math.abs(days) < 7) return { label: days > 0 ? `in ${days}d` : `${-days}d ago`, tone };
  return { label: format(d, "d MMM"), tone };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}m`;
}

/** `datetime-local` input value <-> ISO string (in the device's time zone). */
export function toLocalInput(iso: string | null): string {
  return iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "";
}
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
