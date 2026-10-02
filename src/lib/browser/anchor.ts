/** Where to put a top-layer popover next to its trigger, in viewport pixels. */
export type AnchoredPlacement = {
  top: number;
  left: number;
  minWidth: number;
  maxHeight: number;
};

const GAP = 6;
const EDGE = 12;
const MIN_HEIGHT = 120;

/**
 * Places a popover below its trigger, or above when there's more room there,
 * aligned to the trigger's left or right edge and kept inside the viewport.
 * `wantedHeight` is the popover's natural height; it scrolls past `maxHeight`.
 */
export function anchorTo(
  trigger: HTMLElement,
  {
    wantedHeight,
    width,
    align = "left",
  }: { wantedHeight: number; width: number; align?: "left" | "right" },
): AnchoredPlacement {
  const r = trigger.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - GAP - EDGE;
  const above = r.top - GAP - EDGE;
  const up = below < wantedHeight && above > below;
  const maxHeight = Math.max(MIN_HEIGHT, Math.min(wantedHeight, up ? above : below));
  const rawLeft = align === "right" ? r.right - width : r.left;
  return {
    top: up ? r.top - GAP - maxHeight : r.bottom + GAP,
    left: Math.max(EDGE, Math.min(rawLeft, window.innerWidth - width - EDGE)),
    minWidth: width,
    maxHeight,
  };
}

/** Enter/exit transition for top-layer popovers (fade + slight rise). */
export const POPOVER_MOTION =
  "opacity-0 -translate-y-1 transition-[opacity,translate,display,overlay] transition-discrete duration-(--dur-2) ease-out open:translate-y-0 open:opacity-100 starting:open:-translate-y-1 starting:open:opacity-0";
