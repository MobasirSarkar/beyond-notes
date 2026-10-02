"use client";

import { animate, utils } from "animejs";

const CHARS = ["*", "+", "·", "✦", "░", "▪", "★"];

/** ASCII confetti burst at a screen point (anime.js). No-op with reduced motion. */
export function asciiBurst(x: number, y: number, reduced: boolean): void {
  if (reduced || typeof document === "undefined") return;
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:120;`;
  const nodes: HTMLSpanElement[] = [];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.textContent = CHARS[i % CHARS.length] ?? "*";
    s.style.cssText =
      "position:absolute;left:0;top:0;font-family:VT323,monospace;font-size:22px;color:var(--accent);text-shadow:0 0 6px var(--glow)";
    host.appendChild(s);
    nodes.push(s);
  }
  document.body.appendChild(host);
  animate(nodes, {
    x: () => utils.random(-90, 90),
    y: () => utils.random(-110, 30),
    rotate: () => utils.random(-180, 180),
    opacity: [1, 0],
    scale: [{ from: 1.4, to: 0.6 }],
    duration: () => utils.random(500, 900),
    ease: "outExpo",
    onComplete: () => host.remove(),
  });
}
