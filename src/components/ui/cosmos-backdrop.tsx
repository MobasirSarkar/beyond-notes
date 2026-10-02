"use client";

import { usePrefs } from "@/lib/stores/prefs";
import { cn } from "@/lib/utils/cn";
import type { CosmosVariant } from "@/types/cosmos";

import { Cosmos } from "./cosmos";

type Props = { variant?: CosmosVariant; className?: string };

/**
 * Fixed, full-viewport galaxy behind the page. `hero` is the landing
 * centrepiece; `ambient` is a slower, dimmer corner galaxy for the app,
 * with a token-coloured veil so content stays the focus. Can be disabled.
 */
export function CosmosBackdrop({ variant = "ambient", className }: Props) {
  const enabled = usePrefs((p) => p.ambient);
  if (!enabled) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10", className)}>
      <Cosmos variant={variant} />
      {variant === "ambient" ? (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--bg)_0%,color-mix(in_oklch,var(--bg)_70%,transparent)_35%,transparent_75%)]" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_45%,color-mix(in_oklch,var(--bg)_85%,transparent)_0%,transparent_55%)]" />
      )}
    </div>
  );
}
