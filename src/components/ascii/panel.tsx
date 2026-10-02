import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Props = {
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  as?: "section" | "div" | "article" | "aside";
};

/** TUI-style panel with a title embedded in the top border: ┌─[ TITLE ]──┐ */
export function Panel({
  title,
  actions,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: Props) {
  return (
    <Tag className={cn("px-panel", title ? "mt-3" : "", className)}>
      {title ? (
        <div className="px-legend glow text-fg">
          <span className="text-muted">[</span> {title} <span className="text-muted">]</span>
        </div>
      ) : null}
      {actions ? (
        <div className="absolute -top-3.5 right-3 flex gap-1 bg-bg px-1">{actions}</div>
      ) : null}
      <div className={cn("p-4 pt-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}
