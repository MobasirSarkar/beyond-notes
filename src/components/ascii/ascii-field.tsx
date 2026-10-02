"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const RAMP = " .,:;irsXA253hMHGS#9B&@";
const CELL = 14;

/**
 * Full-bleed ASCII "plasma" field rendered on a canvas, driven by an anime.js
 * timer at a deliberately retro 24fps. Reacts to the pointer with a ripple.
 */
export function AsciiField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cols = 0;
    let rows = 0;
    let color = "#3fbf63";
    const pointer = { x: -1000, y: -1000 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      color =
        getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || color;
      ctx.font = `${CELL}px VT323, ui-monospace, monospace`;
      ctx.textBaseline = "top";
    };

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const time = t / 1000;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * CELL;
          const py = y * CELL;
          const d = Math.hypot(px - pointer.x, py - pointer.y);
          const ripple = d < 220 ? Math.sin(d / 18 - time * 6) * (1 - d / 220) : 0;
          const v =
            Math.sin(x * 0.11 + time * 0.9) +
            Math.sin(y * 0.13 - time * 0.7) +
            Math.sin((x + y) * 0.07 + time * 0.5) +
            ripple * 2;
          const n = (v + 3) / 6; // ~0..1
          const idx = Math.max(0, Math.min(RAMP.length - 1, Math.floor(n * n * RAMP.length)));
          const ch = RAMP[idx];
          if (ch && ch !== " ") ctx.fillText(ch, px, py);
        }
      }
    };

    resize();
    const onResize = () => resize();
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });

    if (reduced) {
      draw(0);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onMove);
      };
    }

    const timer = createTimer({
      frameRate: 24,
      loop: true,
      duration: 1_000_000,
      onUpdate: (self) => draw(self.currentTime),
    });

    const onVisibility = () => {
      if (document.hidden) timer.pause();
      else timer.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      timer.revert();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
