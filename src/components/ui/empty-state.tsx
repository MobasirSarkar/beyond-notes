import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = { title: string; children?: ReactNode; action?: ReactNode; className?: string };

export function EmptyState({ title, children, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rule-dashed px-6 py-12 text-center hairline",
        className,
      )}
    >
      <pre aria-hidden className="text-xs leading-tight text-subtle">
        {"┌─────┐\n│  ·  │\n└─────┘"}
      </pre>
      <p className="text-sm font-medium">{title}</p>
      {children ? <p className="max-w-sm text-sm text-muted">{children}</p> : null}
      {action}
    </div>
  );
}
