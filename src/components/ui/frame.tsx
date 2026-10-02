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
 * Glass panel with an optional label row (title · meta · actions).
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
    <Tag className={cn("overflow-hidden rounded-panel glass", className)}>
      {title || actions || meta ? (
        <header className="flex min-h-11 items-center gap-3 px-5 py-2 rule-b">
          {title ? <h2 className="type-subheading">{title}</h2> : null}
          {meta ? <span className="type-caption">{meta}</span> : null}
          {actions ? <div className="ml-auto flex items-center gap-1">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </Tag>
  );
}
