"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const RAMP = " .:-=+*#";
/** Cell size in rem; converted with the root font size so it scales with user zoom. */
const CELL_REM = 1;

/**
 * Subtle ASCII field on a canvas, driven by an anime.js timer at 20fps.
 * Pauses when hidden or scrolled out of view; reacts to the pointer.
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
    let cell = 16;
    let color = "";
    let width = 0;
    let height = 0;
    const pointer = { x: -1e4, y: -1e4 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const styles = getComputedStyle(document.documentElement);
      cell = CELL_REM * Number.parseFloat(styles.fontSize);
      color = styles.getPropertyValue("--fg-subtle").trim();
      cols = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      ctx.font = `${cell * 0.75}px ${styles.getPropertyValue("--font-family-mono")}`;
      ctx.textBaseline = "top";
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const time = t / 1000;
      const reach = cell * 14;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cell;
          const py = y * cell;
          const d = Math.hypot(px - pointer.x, py - pointer.y);
          const ripple = d < reach ? Math.sin(d / cell - time * 5) * (1 - d / reach) : 0;
          const v =
            Math.sin(x * 0.12 + time * 0.6) + Math.sin(y * 0.16 - time * 0.4) + ripple * 1.5;
          const n = Math.max(0, (v + 2) / 4);
          const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(n * n * RAMP.length))];
          if (ch && ch !== " ") ctx.fillText(ch, px, py);
        }
      }
    };

    resize();
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    const cleanupListeners = () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };

    if (reduced) {
      draw(0);
      return cleanupListeners;
    }

    const timer = createTimer({
      frameRate: 20,
      loop: true,
      duration: 1e6,
      onUpdate: (self) => draw(self.currentTime),
    });
    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) timer.resume();
      else timer.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    return () => {
      timer.revert();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      cleanupListeners();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
