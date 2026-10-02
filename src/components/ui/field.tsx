import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null | undefined;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, with consistent vertical rhythm. */
export function Field({ label, htmlFor, hint, error, className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="type-label">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="type-caption text-fg">
          {error}
        </p>
      ) : hint ? (
        <p className="type-caption">{hint}</p>
      ) : null}
    </div>
  );
}
