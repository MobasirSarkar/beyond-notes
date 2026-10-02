import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = { title: string; children?: ReactNode; action?: ReactNode; className?: string };

/** Empty state with a tiny orbit illustration. */
export function EmptyState({ title, children, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-panel glass px-6 py-14 text-center",
        className,
      )}
    >
      <span aria-hidden className="relative block size-12">
        <span className="absolute inset-0 rounded-full rule-dashed hairline" />
        <span className="absolute inset-3.5 rounded-full bg-fg" />
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-fg" />
      </span>
      <p className="type-heading">{title}</p>
      {children ? <p className="max-w-sm text-sm text-muted">{children}</p> : null}
      {action}
    </div>
  );
}
