import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** Section divider with an inline heading and a hairline to the edge. */
export function Rule({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator">
      {children ? <span className="type-overline">{children}</span> : null}
      <span aria-hidden className="flex-1 rule-t" />
    </div>
  );
}
