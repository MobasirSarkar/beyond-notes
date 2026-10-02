"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  className?: string;
  label?: string;
};

/** ASCII checkbox: `[x]` / `[ ]`. */
export function Checkbox({ checked, onChange, children, className, label }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("group inline-flex items-center gap-2 text-left text-sm", className)}
    >
      <span aria-hidden className="shrink-0 text-muted group-hover:text-fg">
        {checked ? "[x]" : "[ ]"}
      </span>
      {children}
    </button>
  );
}
