"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  className?: string;
  label?: string;
};

export function Checkbox({ checked, onChange, children, className, label }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("group inline-flex items-center gap-3 text-left text-sm", className)}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-sm lift transition-colors duration-(--dur-1)",
          checked ? "rule-strong bg-fg text-bg" : "group-hover:rule-strong",
        )}
      >
        {checked ? <Check strokeWidth={2.5} className="size-3" /> : null}
      </span>
      {children}
    </button>
  );
}
