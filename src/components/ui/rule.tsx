import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** Section divider with an inline label: `label ────────────`. */
export function Rule({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator">
      {children ? <span className="label">{children}</span> : null}
      <span aria-hidden className="flex-1 rule-t" />
    </div>
  );
}
