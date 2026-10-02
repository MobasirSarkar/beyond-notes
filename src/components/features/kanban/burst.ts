"use client";

import { animate, utils } from "animejs";

const SVG_NS = "http://www.w3.org/2000/svg";
/** Four-point sparkle, drawn in a 10×10 box. */
const SPARKLE =
  "M5 0 C5.4 3.6 6.4 4.6 10 5 C6.4 5.4 5.4 6.4 5 10 C4.6 6.4 3.6 5.4 0 5 C3.6 4.6 4.6 3.6 5 0Z";
const DOTS = 12;
const SPARKLES = 4;

function particle(size: string, sparkle: boolean): HTMLElement | SVGSVGElement {
  if (sparkle) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", SPARKLE);
    path.setAttribute("fill", "currentColor");
    svg.appendChild(path);
    Object.assign(svg.style, {
      position: "absolute",
      width: size,
      height: size,
      translate: "-50% -50%",
    });
    return svg;
  }
  const dot = document.createElement("span");
  Object.assign(dot.style, {
    position: "absolute",
    width: size,
    height: size,
    translate: "-50% -50%",
    borderRadius: "50%",
    background: "currentColor",
    boxShadow: "var(--shadow-glow)",
  });
  return dot;
}

/** A small supernova at a screen point when a task is completed (anime.js). */
export function starBurst(x: number, y: number, reduced: boolean): void {
  if (reduced || typeof document === "undefined") return;
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    pointerEvents: "none",
    color: "var(--fg)",
    zIndex: "var(--z-toast)",
  });

  const ring = document.createElement("span");
  Object.assign(ring.style, {
    position: "absolute",
    width: "6rem",
    height: "6rem",
    translate: "-50% -50%",
    borderRadius: "50%",
    border: "var(--bw) solid currentColor",
  });
  host.appendChild(ring);

  const parts = Array.from({ length: DOTS + SPARKLES }, (_, i) => {
    const sparkle = i >= DOTS;
    const el = particle(
      sparkle ? `${utils.random(0.7, 1, 2)}rem` : `${utils.random(0.2, 0.35, 2)}rem`,
      sparkle,
    );
    host.appendChild(el);
    const angle = (i / (DOTS + SPARKLES)) * Math.PI * 2 + utils.random(-0.3, 0.3, 2);
    const dist = utils.random(2.2, 4.8, 2);
    return { el, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist };
  });
  document.body.appendChild(host);

  animate(ring, { scale: [0.1, 1], opacity: [0.6, 0], duration: 700, ease: "outExpo" });
  let pending = parts.length;
  for (const { el, dx, dy } of parts) {
    animate(el, {
      x: [0, `${dx}rem`],
      y: [0, `${dy}rem`],
      scale: [1, 0],
      rotate: [0, utils.random(-90, 90)],
      duration: utils.random(650, 1000),
      ease: "outExpo",
      onComplete: () => {
        pending -= 1;
        if (pending === 0) host.remove();
      },
    });
  }
}
