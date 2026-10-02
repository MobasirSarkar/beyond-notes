"use client";

import { usePrefs } from "@/lib/stores/prefs";
import { cn } from "@/lib/utils/cn";

import { AsciiField } from "./ascii-field";

type Props = {
  /** Vignette shape: `center` keeps the middle clear (landing), `edges` keeps content areas calm (app). */
  focus?: "center" | "edges";
  fps?: number;
  className?: string;
};

/**
 * The shared ambient background (landing, auth and app): a fixed ASCII field
 * behind everything, softened by a token-colored vignette for readability.
 * Users can turn it off in settings.
 */
export function AsciiBackdrop({ focus = "edges", fps = 16, className }: Props) {
  const enabled = usePrefs((p) => p.ambient);
  if (!enabled) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10", className)}>
      <AsciiField className="size-full opacity-60" fps={fps} />
      <div
        className={cn(
          "absolute inset-0",
          focus === "center"
            ? "bg-[radial-gradient(ellipse_at_center,var(--bg)_25%,transparent_75%)]"
            : "bg-[radial-gradient(ellipse_at_top,var(--bg)_10%,color-mix(in_oklch,var(--bg)_55%,transparent)_70%)]",
        )}
      />
    </div>
  );
}
