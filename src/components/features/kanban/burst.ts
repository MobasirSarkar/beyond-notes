"use client";

import { animate, utils } from "animejs";

const CHARS = ["*", "+", "·", "×", "░"];

/** Monochrome ASCII burst at a screen point (anime.js). No-op with reduced motion. */
export function asciiBurst(x: number, y: number, reduced: boolean): void {
  if (reduced || typeof document === "undefined") return;
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    pointerEvents: "none",
    zIndex: "var(--z-toast)",
  });
  const nodes = CHARS.flatMap((ch) =>
    [0, 1, 2].map(() => {
      const s = document.createElement("span");
      s.textContent = ch;
      Object.assign(s.style, {
        position: "absolute",
        fontSize: "var(--text-md)",
        color: "var(--fg)",
      });
      host.appendChild(s);
      return s;
    }),
  );
  document.body.appendChild(host);
  animate(nodes, {
    x: () => `${utils.random(-5, 5, 2)}rem`,
    y: () => `${utils.random(-6, 1.5, 2)}rem`,
    opacity: [1, 0],
    duration: () => utils.random(500, 850),
    ease: "outExpo",
    onComplete: () => host.remove(),
  });
}
