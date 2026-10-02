"use client";

import { Toaster as Sonner } from "sonner";

/** Monochrome toast styling bound to design tokens. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset="calc(var(--dock-space) + 0.5rem)"
      mobileOffset="calc(var(--dock-space) + 0.5rem)"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass-strong flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-card px-4 py-3 text-sm text-fg",
          title: "font-medium",
          description: "mt-0.5 text-xs text-muted",
          actionButton:
            "hairline ml-auto h-7 shrink-0 rounded-full px-3 text-xs hover:bg-fg hover:text-bg",
          cancelButton: "h-7 shrink-0 px-2 text-xs text-muted",
          error: "rule-strong",
        },
      }}
    />
  );
}
