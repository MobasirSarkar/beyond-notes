"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const RAMP = " .:-=+*#";
/** Cell size in rem; converted with the root font size so it follows user zoom. */
const CELL_REM = 1;

type Props = {
  className?: string;
  /** Frames per second for the anime.js timer (lower = cheaper). */
  fps?: number;
  /** Disable the animation entirely (draws one static frame). */
  paused?: boolean;
};

/**
 * Ambient ASCII field on a canvas, driven by an anime.js timer.
 *
 * Efficient by design: glyphs are pre-rendered once into an atlas and blitted
 * with drawImage, the loop pauses while the tab is hidden or the canvas is
 * off-screen, and the color re-syncs whenever the theme changes.
 */
export function AsciiField({ className, fps = 20, paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const still = reduced || paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");
    if (!actx) return;

    let cols = 0;
    let rows = 0;
    let cell = 16;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let lastTime = 0;
    const pointer = { x: -1e4, y: -1e4 };

    /** Pre-renders every ramp glyph once in the current theme color. */
    const buildAtlas = () => {
      const styles = getComputedStyle(document.documentElement);
      const px = Math.ceil(cell * dpr);
      atlas.width = px * RAMP.length;
      atlas.height = px;
      actx.clearRect(0, 0, atlas.width, atlas.height);
      actx.fillStyle = styles.getPropertyValue("--fg-subtle").trim();
      actx.font = `${px * 0.75}px ${styles.getPropertyValue("--font-family-mono")}`;
      actx.textBaseline = "top";
      for (let i = 1; i < RAMP.length; i++) actx.fillText(RAMP[i] ?? "", i * px, 0);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = CELL_REM * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      cols = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      buildAtlas();
      draw(lastTime);
    };

    function draw(t: number) {
      lastTime = t;
      ctx?.clearRect(0, 0, width, height);
      const time = t / 1000;
      const reach = cell * 14;
      const src = Math.ceil(cell * dpr);
      for (let y = 0; y < rows; y++) {
        const py = y * cell;
        const wy = Math.sin(y * 0.16 - time * 0.4);
        for (let x = 0; x < cols; x++) {
          const px = x * cell;
          const d = Math.hypot(px - pointer.x, py - pointer.y);
          const ripple = d < reach ? Math.sin(d / cell - time * 5) * (1 - d / reach) : 0;
          const v = Math.sin(x * 0.12 + time * 0.6) + wy + ripple * 1.5;
          const n = Math.max(0, (v + 2) / 4);
          const i = Math.min(RAMP.length - 1, Math.floor(n * n * RAMP.length));
          if (i > 0) ctx?.drawImage(atlas, i * src, 0, src, src, px, py, cell, cell);
        }
      }
    }

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };

    // Re-tint when the theme attribute or OS color scheme changes.
    const themeObserver = new MutationObserver(() => {
      buildAtlas();
      draw(lastTime);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      buildAtlas();
      draw(lastTime);
    };
    schemeQuery.addEventListener("change", onScheme);

    resize();
    window.addEventListener("resize", onResize);
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });

    const cleanup = () => {
      cancelAnimationFrame(resizeFrame);
      themeObserver.disconnect();
      schemeQuery.removeEventListener("change", onScheme);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
    if (still) return cleanup;

    const timer = createTimer({
      frameRate: fps,
      loop: true,
      duration: 1e6,
      onUpdate: (self) => draw(self.currentTime),
    });
    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) timer.resume();
      else timer.pause();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    return () => {
      timer.revert();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      cleanup();
    };
  }, [still, fps]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
