import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-xs text-muted", className)}>#{children}</span>;
}

/** Toggleable tag chip used for filters. */
export function TagToggle({
  active,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-7 px-2 text-xs transition-colors duration-(--dur-1) hairline",
        active ? "rule-strong bg-fg text-bg" : "text-muted hover:rule-strong hover:text-fg",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
