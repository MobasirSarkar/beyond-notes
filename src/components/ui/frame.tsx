import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  as?: "section" | "div" | "article" | "aside";
};

/**
 * Bordered container with a label row: `TITLE  meta ··········· actions`.
 * The basic building block for grouping content.
 */
export function Frame({
  title,
  meta,
  actions,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: Props) {
  return (
    <Tag className={cn("bg-bg hairline", className)}>
      {title || actions || meta ? (
        <header className="flex min-h-10 items-center gap-3 px-4 py-2 rule-b">
          {title ? <h2 className="subheading">{title}</h2> : null}
          {meta ? <span className="text-xs text-subtle">{meta}</span> : null}
          {actions ? <div className="ml-auto flex items-center gap-1">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}
