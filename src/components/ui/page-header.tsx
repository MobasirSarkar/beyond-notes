import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { RevealText } from "./reveal-text";

type Props = {
  /** Small label above the title naming the section, e.g. `schedule`. */
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** Consistent page heading: eyebrow → title → description, actions to the right. */
export function PageHeader({ eyebrow, title, description, actions, className, children }: Props) {
  return (
    <header className={cn("mb-(--section-gap) flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="label">{eyebrow}</p>
          <h1 className="truncate heading text-display">
            <RevealText text={title} />
          </h1>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
