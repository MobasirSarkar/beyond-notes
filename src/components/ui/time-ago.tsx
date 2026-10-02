"use client";

import { formatDistanceStrict } from "date-fns";

import { useNow } from "@/hooks/use-now";

/** "3 minutes ago", rendered on the client only (empty `<time>` while hydrating). */
export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const now = useNow();
  const at = new Date(date);
  return (
    <time dateTime={at.toISOString()} className={className}>
      {now === null
        ? null
        : formatDistanceStrict(Math.min(at.getTime(), now), now, { addSuffix: true })}
    </time>
  );
}
